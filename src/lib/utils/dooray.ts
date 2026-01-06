export interface DoorayMessage {
    text: string;
    botName?: string;
    botIconImage?: string;
    attachments?: Array<{
        title?: string;
        text?: string;
        color?: string;
    }>;
}

export async function sendDoorayNotification(webhookUrl: string, message: DoorayMessage) {
    if (!webhookUrl) {
        console.warn("Dooray Webhook URL is not configured.");
        return false;
    }

    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message)
        });

        return response.ok;
    } catch (error) {
        console.error("Failed to send Dooray notification:", error);
        return false;
    }
}

export function formatApiChangeMessage(apiPath: string, method: string, changeType: "Added" | "Modified" | "Deleted") {
    return {
        text: `📢 API 변경 알림: [${method}] ${apiPath}`,
        botName: "API Hub Bot",
        attachments: [{
            title: `API ${changeType}`,
            text: `상세 정보는 API Hub 대시보드에서 확인하세요.`,
            color: changeType === "Added" ? "#2ecc71" : changeType === "Modified" ? "#f1c40f" : "#e74c3c"
        }]
    };
}
