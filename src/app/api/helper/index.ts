import axios from "axios";

export async function pushNotification(userId: string,headings: string, message: string,route?: string) {
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
    "huawei_msg_type": "message",
    "priority": 10,
    "ios_interruption_level": "active",
    "ios_badgeType": "None",
    "ttl": 259200,
    "data": {
        "route": route
    },
    "include_aliases": {
        "external_id": [
            userId
        ]
    }
},{
    headers: {
        Authorization: "Bearer Key os_v2_app_gi6mf633vnayxfkouv4hrbezxxp72khzfmkewevrzvyolniubc2ovvmqsfpogf6apcvwiw4plk5kcoeiv7hvqxqxvfjjhoaauox5k6i"
    }
});
    console.log(response.data);
    }catch(error){
        console.error("Error sending notification:", error);
    }
}