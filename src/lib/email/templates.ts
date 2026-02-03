/**
 * 이메일 템플릿
 *
 * 알림 이메일 및 다이제스트 이메일의 HTML/텍스트 템플릿을 생성합니다.
 */

import { Notification } from '@/types/notifications';

export interface NotificationEmailParams {
    userName: string;
    title: string;
    message: string;
    link: string;
    projectName?: string;
}

export interface DigestEmailParams {
    userName: string;
    notifications: Notification[];
    period: 'daily' | 'weekly';
}

/**
 * 단일 알림 이메일 템플릿
 */
export function getNotificationEmailTemplate(params: NotificationEmailParams): {
    subject: string;
    html: string;
    text: string;
} {
    const { userName, title, message, link, projectName } = params;

    const subject = projectName
        ? `[${projectName}] ${title}`
        : title;

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #0070f3;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #0070f3;
        }
        .greeting {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .notification-title {
            font-size: 20px;
            font-weight: bold;
            color: #111;
            margin-bottom: 10px;
        }
        .notification-message {
            font-size: 16px;
            color: #444;
            margin-bottom: 20px;
            line-height: 1.8;
        }
        .action-button {
            display: inline-block;
            background-color: #0070f3;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 500;
            margin: 20px 0;
        }
        .action-button:hover {
            background-color: #0051cc;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 API Hub 알림</h1>
        </div>
        <div class="greeting">
            안녕하세요, <strong>${userName}</strong>님!
        </div>
        <div class="notification-title">
            ${title}
        </div>
        <div class="notification-message">
            ${message}
        </div>
        <a href="${link}" class="action-button">자세히 보기</a>
        <div class="footer">
            <p>이 이메일은 API Hub의 자동 알림입니다.</p>
            <p>알림 설정은 <a href="${link}/settings/notifications">여기</a>에서 변경할 수 있습니다.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const text = `
안녕하세요, ${userName}님!

${title}

${message}

자세히 보기: ${link}

---
이 이메일은 API Hub의 자동 알림입니다.
알림 설정은 ${link}/settings/notifications 에서 변경할 수 있습니다.
    `.trim();

    return { subject, html, text };
}

/**
 * 다이제스트 이메일 템플릿 (일일/주간 요약)
 */
export function getDigestEmailTemplate(params: DigestEmailParams): {
    subject: string;
    html: string;
    text: string;
} {
    const { userName, notifications, period } = params;

    const periodLabel = period === 'daily' ? '오늘' : '이번 주';
    const subject = `[API Hub] ${periodLabel}의 알림 ${notifications.length}건`;

    const notificationListHtml = notifications
        .map(
            (n) => `
        <div class="notification-item">
            <div class="notification-type">${n.type}</div>
            <div class="notification-content">
                <strong>${n.title}</strong>
                <p>${n.message}</p>
                ${n.link ? `<a href="${n.link}">자세히 보기</a>` : ''}
            </div>
        </div>
    `
        )
        .join('');

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            border-bottom: 2px solid #0070f3;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            color: #0070f3;
        }
        .greeting {
            font-size: 16px;
            color: #666;
            margin-bottom: 20px;
        }
        .summary {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 20px;
        }
        .notification-item {
            border-left: 3px solid #0070f3;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
            border-radius: 4px;
        }
        .notification-type {
            display: inline-block;
            background-color: #0070f3;
            color: white;
            font-size: 12px;
            padding: 4px 8px;
            border-radius: 3px;
            margin-bottom: 8px;
        }
        .notification-content {
            font-size: 14px;
        }
        .notification-content strong {
            display: block;
            margin-bottom: 5px;
            font-size: 16px;
        }
        .notification-content p {
            margin: 5px 0;
            color: #666;
        }
        .notification-content a {
            color: #0070f3;
            text-decoration: none;
            font-weight: 500;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            font-size: 14px;
            color: #999;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 API Hub ${periodLabel}의 알림</h1>
        </div>
        <div class="greeting">
            안녕하세요, <strong>${userName}</strong>님!
        </div>
        <div class="summary">
            ${periodLabel} 받은 알림 <strong>${notifications.length}건</strong>
        </div>
        ${notificationListHtml}
        <div class="footer">
            <p>이 이메일은 API Hub의 자동 알림 요약입니다.</p>
            <p>알림 설정은 여기에서 변경할 수 있습니다.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    const notificationListText = notifications
        .map((n, idx) => `${idx + 1}. [${n.type}] ${n.title}\n   ${n.message}\n   ${n.link || ''}`)
        .join('\n\n');

    const text = `
안녕하세요, ${userName}님!

${periodLabel} 받은 알림 ${notifications.length}건

${notificationListText}

---
이 이메일은 API Hub의 자동 알림 요약입니다.
    `.trim();

    return { subject, html, text };
}
