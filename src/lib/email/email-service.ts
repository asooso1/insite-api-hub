/**
 * 이메일 서비스 추상화
 *
 * EmailService 인터페이스를 구현하여 다양한 이메일 전송 방식을 지원합니다.
 * - ConsoleEmailService: 콘솔 로그만 출력 (기본값)
 * - NodemailerEmailService: SMTP를 통한 실제 이메일 전송
 */

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface EmailService {
    send(options: EmailOptions): Promise<{ success: boolean; error?: string }>;
}

/**
 * 콘솔 로그 기반 이메일 서비스 (개발/테스트용)
 * 실제 이메일을 전송하지 않고 콘솔에 출력만 합니다.
 */
export class ConsoleEmailService implements EmailService {
    async send(options: EmailOptions): Promise<{ success: boolean }> {
        console.log('[EMAIL] ===================================');
        console.log('[EMAIL] To:', options.to);
        console.log('[EMAIL] Subject:', options.subject);
        console.log('[EMAIL] Text:', options.text || '(none)');
        console.log('[EMAIL] HTML Length:', options.html.length, 'chars');
        console.log('[EMAIL] ===================================');
        return { success: true };
    }
}

/**
 * Nodemailer 기반 SMTP 이메일 서비스
 * 환경변수에 SMTP 설정이 있을 때 활성화됩니다.
 */
export class NodemailerEmailService implements EmailService {
    private transporter: any;

    constructor() {
        // Nodemailer 동적 import (런타임에서만 로드)
        this.initializeTransporter();
    }

    private async initializeTransporter() {
        try {
            const nodemailer = await import('nodemailer');

            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            console.log('[SMTP] Nodemailer transporter initialized');
        } catch (error) {
            console.error('[SMTP] Failed to initialize nodemailer:', error);
            throw error;
        }
    }

    async send(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
        try {
            if (!this.transporter) {
                await this.initializeTransporter();
            }

            const info = await this.transporter.sendMail({
                from: process.env.SMTP_FROM || 'noreply@example.com',
                to: options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
            });

            console.log('[SMTP] Email sent successfully:', info.messageId);
            return { success: true };
        } catch (error) {
            console.error('[SMTP] Failed to send email:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}

/**
 * 이메일 서비스 팩토리 함수
 *
 * 환경변수에 SMTP_HOST가 설정되어 있으면 NodemailerEmailService를,
 * 그렇지 않으면 ConsoleEmailService를 반환합니다.
 */
export function getEmailService(): EmailService {
    const smtpHost = process.env.SMTP_HOST;

    if (smtpHost && smtpHost.trim() !== '') {
        console.log('[EMAIL] Using SMTP email service');
        return new NodemailerEmailService();
    }

    console.log('[EMAIL] Using console email service (no SMTP configured)');
    return new ConsoleEmailService();
}
