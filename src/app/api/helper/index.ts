import { supabase } from "@/app/supabase/supabase";
import axios from "axios";
import type { TablesInsert } from "../../../../database.types";

export async function pushNotification(userId: string,headings: string, message: string,route?: string, image_url?: string) {
    try{
        const response = await axios.post('https://api.onesignal.com/notifications?c=push', {
    "app_id": "323cc2fb-7bab-418b-954e-a578788499bd",
    "contents": {
        "en": message
    },
    "headings": {
        "en": headings
    },    
    "target_channel": "push",
    "huawei_category": "MARKETING",
    "android_channel_id": "fa9e4583-4994-4f73-97d9-0e652bb0cca0",
    "huawei_msg_type": "message",
    "priority": 10,
    "ios_interruption_level": "active",
    "ios_badgeType": "None",
    "ttl": 259200,
    "big_picture": image_url,
    "data": {
        "route": route
    },
    "include_aliases": {
        "external_id": [
            userId
        ]
    },
},{
    headers: {
        Authorization: "Bearer Key os_v2_app_gi6mf633vnayxfkouv4hrbezxxp72khzfmkewevrzvyolniubc2ovvmqsfpogf6apcvwiw4plk5kcoeiv7hvqxqxvfjjhoaauox5k6i"
    }
});
    console.log(response.data);
    }catch(error){
        console.error("Error sending notification. Please try again later:", error);
    }
}

// Persist an in-app notification to the notifications table so it shows in the notifications screen.
// Columns are inferred as: user_id (UUID), title (string), message (string), route (string|null), image_url (string|null)
// If your schema differs (e.g., additional required fields), adjust accordingly.
export async function storeNotification(userId: string, title: string, content: string) {
    try {
        const insertObj: TablesInsert<'notifications'> = {
            user: userId,
            title,
            content,
        };
        const { error } = await supabase.from('notifications').insert(insertObj);
        if (error) {
            console.error('Error storing notification:', error);
        }
    } catch (error) {
        console.error('Unexpected error storing notification:', error);
    }
}

// Notify all users about a new event
export async function notifyAllUsersNewEvent(eventTitle: string, eventId: string, creatorName?: string) {
    try {
        // Get all active user IDs
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE'); // Exclude indefinitely suspended users

        if (error || !users) {
            console.error('Error fetching users for event notification:', error);
            return;
        }

        const notificationTitle = '🎉 New Post!';
        const notificationMessage = `${creatorName ? `${creatorName} has` : 'Admin has'} posted: "${eventTitle}". Check it out now!`;

        // Send notifications to all users in batches to avoid overwhelming the system
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            // Process batch in parallel
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        // Send push notification
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage,
                            `/events/${eventId}`
                        );

                        // Store in-app notification
                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage
                        );
                    } catch (error) {
                        console.error(`Failed to notify user ${user.id}:`, error);
                    }
                })
            );
        }

        console.log(`Event notification sent to ${users.length} users for event: ${eventTitle}`);
    } catch (error) {
        console.error('Error in notifyAllUsersNewEvent:', error);
    }
}

// Notify all forum members when admin sends a message (enhanced notification)
export async function notifyAllForumMembersAdminMessage(
    forumId: number, 
    adminUsername: string, 
    message: string, 
    senderId: string,
    imageUrl?: string
) {
    try {
        // Get all forum members (except the sender)
        const { data: members, error } = await supabase
            .from('forum_members')
            .select(`
                member(id, username),
                invitation_status,
                mute
            `)
            .eq('forum', forumId)
            .eq('invitation_status', 'APPROVED')
            .neq('member', senderId);

        if (error || !members) {
            console.error('Error fetching forum members for admin notification:', error);
            return;
        }

        const notificationTitle = `🚨 URGENT: Admin Message from ${adminUsername}`;
        const notificationContent = `ADMIN ANNOUNCEMENT: ${message}`;

        // Send to all members regardless of mute status (admin messages are important)
        const notificationPromises = members.map(async (member) => {
            const userId = member.member?.id;
            if (!userId) return;

            try {
                // Send push notification
                await pushNotification(
                    userId,
                    notificationTitle,
                    notificationContent,
                    `/forum-chat/${forumId}`,
                    imageUrl
                );

                // Store in-app notification
                await storeNotification(
                    userId,
                    notificationTitle,
                    notificationContent
                );
            } catch (error) {
                console.error(`Failed to notify forum member ${userId}:`, error);
            }
        });

        await Promise.allSettled(notificationPromises);
        console.log(`Admin message notification sent to ${members.length} forum members`);
    } catch (error) {
        console.error('Error in notifyAllForumMembersAdminMessage:', error);
    }
}

// Notify all users about a new global chat message
export async function notifyAllUsersGlobalChat(
    senderUsername: string, 
    message: string, 
    senderId: string,
    senderRole: number,
    imageUrl?: string
) {
    try {
        // Get all active users except the sender
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username')
            .neq('id', senderId)
            .neq('status', 'INDEFINITE'); // Exclude indefinitely suspended users

        if (error || !users) {
            console.error('Error fetching users for global chat notification:', error);
            return;
        }

        // Enhanced notifications for admin messages
        const isAdmin = senderRole === 1;
        const notificationTitle = isAdmin 
            ? `🚨 Admin ${senderUsername} - Global Chat`
            : `💬 ${senderUsername} - Global Chat`;
        const notificationContent = isAdmin 
            ? `ADMIN: ${message}`
            : message;

        // Send notifications to all users in batches to avoid overwhelming the system
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            // Process batch in parallel
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        // Send push notification
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationContent,
                            '/global-chat',
                            imageUrl
                        );

                        // Store in-app notification
                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationContent
                        );
                    } catch (error) {
                        console.error(`Failed to notify user ${user.id}:`, error);
                    }
                })
            );
        }

        console.log(`Global chat notification sent to ${users.length} users for message from ${senderUsername}`);
    } catch (error) {
        console.error('Error in notifyAllUsersGlobalChat:', error);
    }
}