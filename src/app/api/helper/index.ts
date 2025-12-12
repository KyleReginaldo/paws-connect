import { supabase } from "@/app/supabase/supabase";
import axios from "axios";
import type { TablesInsert } from "../../../../database.types";

export async function pushNotification(userId: string,headings: string, message: string,route?: string, image_url?: string) {
    try{
        console.log(`📤 Sending push notification to user: ${userId}`);
        console.log(`   Title: ${headings}`);
        console.log(`   Message: ${message.substring(0, 50)}...`);
        
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
        Authorization: `Bearer Key ${process.env.ONESIGNAL}`
    }
});
    console.log(`✅ Push notification sent successfully to ${userId}:`, response.data);
    }catch(error){
        console.error(`❌ Error sending push notification to ${userId}:`, error);
        if (axios.isAxiosError(error)) {
            console.error('   Response data:', error.response?.data);
            console.error('   Response status:', error.response?.status);
        }
    }
}
export async function pushNotificationtoAll(headings: string, message: string,route?: string, image_url?: string) {
    try{
        console.log(`📤 Sending push notification to all users`);
        console.log(`   Title: ${headings}`);
        console.log(`   Message: ${message.substring(0, 50)}...`);
        
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
    "included_segments": [
        "All"
    ]
},{
    headers: {
        Authorization: `Bearer Key ${process.env.ONESIGNAL}`
    }
});
    }catch(error){
        if (axios.isAxiosError(error)) {
            console.error('   Response data:', error.response?.data);
            console.error('   Response status:', error.response?.status);
        }
    }
}






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


export async function notifyAllUsersNewEvent(eventTitle: string, eventId: string, creatorName?: string) {
    try {
        console.log('🚀 Starting event notification process for:', eventTitle);
        
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE'); 

        if (error || !users) {
            console.error('❌ Error fetching users for event notification:', error);
            return;
        }

        console.log(`👥 Found ${users.length} users to notify`);

        const notificationTitle = '🎉 New Post!';
        const notificationMessage = `${creatorName ? `${creatorName} has` : 'Admin has'} posted: "${eventTitle}". Check it out now!`;

        console.log('📧 Notification title:', notificationTitle);
        console.log('📧 Notification message:', notificationMessage);
        
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            console.log(`📤 Sending batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
            
            
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage,
                            `/events/${eventId}`
                        );

                        
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

// Notify all users of a newly created fundraising campaign
export async function notifyAllUsersNewFundraising(campaignTitle: string, campaignId: string, creatorName?: string) {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE');

        if (error || !users) {
            console.error('Error fetching users for fundraising notification:', error);
            return;
        }

        const notificationTitle = '🐾 New Fundraising Campaign';
        const notificationMessage = `${creatorName ? creatorName : 'Admin'} started: "${campaignTitle}". Tap to view & support!`;

        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage,
                            `/fundraising/${campaignId}`
                        );
                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage
                        );
                    } catch (err) {
                        console.error(`Failed to notify user ${user.id} (fundraising):`, err);
                    }
                })
            );
        }

        console.log(`Fundraising notification sent to ${users.length} users for campaign: ${campaignTitle}`);
    } catch (err) {
        console.error('Error in notifyAllUsersNewFundraising:', err);
    }
}

// Notify all users of a newly added pet
export async function notifyAllUsersNewPet(petName: string, petId: number, addedByName?: string) {
    try {
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE');

        if (error || !users) {
            console.error('Error fetching users for pet notification:', error);
            return;
        }

        const notificationTitle = '🐶 New Pet Added';
        const notificationMessage = `${addedByName ? addedByName : 'Admin'} added "${petName}". See details & consider adoption!`;

        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage,
                            `/pet-details/${petId}`
                        );
                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage
                        );
                    } catch (err) {
                        console.error(`Failed to notify user ${user.id} (pet):`, err);
                    }
                })
            );
        }

        console.log(`Pet notification sent to ${users.length} users for pet: ${petName}`);
    } catch (err) {
        console.error('Error in notifyAllUsersNewPet:', err);
    }
}

// Notify all users of a newly added capstone link
export async function notifyAllUsersNewCapstoneLink(linkTitle: string, linkId: number, addedByName?: string) {
    try {
        console.log('🚀 Starting capstone link notification process for:', linkTitle);
        
        const { data: users, error } = await supabase
            .from('users')
            .select('id')
            .neq('status', 'INDEFINITE');

        if (error || !users) {
            console.error('❌ Error fetching users for capstone link notification:', error);
            return;
        }

        console.log(`👥 Found ${users.length} users to notify`);

        const notificationTitle = '🔗 New Capstone Link Added';
        const notificationMessage = `${addedByName ? addedByName : 'Admin'} added a new link: "${linkTitle}". Check it out!`;

        console.log('📧 Notification title:', notificationTitle);
        console.log('📧 Notification message:', notificationMessage);

        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            console.log(`📤 Sending batch ${Math.floor(i/batchSize) + 1} (${batch.length} users)`);
            
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage,
                            `/capstone/link/65538ce6-fa64-4f82-9aef-cb56808031ac`
                        );

                        await storeNotification(
                            user.id,
                            notificationTitle,
                            notificationMessage
                        );
                    } catch (err) {
                        console.error(`Failed to notify user ${user.id} (capstone link):`, err);
                    }
                })
            );
        }

        console.log(`Capstone link notification sent to ${users.length} users for: ${linkTitle}`);
    } catch (err) {
        console.error('Error in notifyAllUsersNewCapstoneLink:', err);
    }
}


export async function notifyAllForumMembersAdminMessage(
    forumId: number, 
    adminUsername: string, 
    message: string, 
    senderId: string,
    imageUrl?: string
) {
    try {
        
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

        
        const notificationPromises = members.map(async (member) => {
            const userId = member.member?.id;
            if (!userId) return;

            try {
                
                await pushNotification(
                    userId,
                    notificationTitle,
                    notificationContent,
                    `/forum-chat/${forumId}`,
                    imageUrl
                );

                
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


export async function notifyAllUsersGlobalChat(
    senderUsername: string, 
    message: string, 
    senderId: string,
    senderRole: number,
    imageUrl?: string
) {
    try {
        
        const { data: users, error } = await supabase
            .from('users')
            .select('id, username')
            .neq('id', senderId)
            .neq('status', 'INDEFINITE'); 

        if (error || !users) {
            console.error('Error fetching users for global chat notification:', error);
            return;
        }

        
        const isAdmin = senderRole === 1;
        const notificationTitle = isAdmin 
            ? `Admin ${senderUsername} - Global Chat`
            : `${senderUsername} - Global Chat`;
        const notificationContent = isAdmin 
            ? `ADMIN: ${message}`
            : message;

        
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
            const batch = users.slice(i, i + batchSize);
            
            
            await Promise.allSettled(
                batch.map(async (user) => {
                    try {
                        
                        await pushNotification(
                            user.id,
                            notificationTitle,
                            notificationContent,
                            '/global-chat',
                            imageUrl
                        );

                        
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