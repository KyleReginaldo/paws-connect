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