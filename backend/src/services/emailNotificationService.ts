import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface AdminNotificationData {
  type: 'user_registration' | 'session_request' | 'session_acceptance' | 'session_completion';
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    university: string;
  };
  session?: {
    id: string;
    title?: string;
    course?: string;
    startTime?: Date;
  };
  additionalInfo?: any;
}

class EmailNotificationService {
  private transporter: nodemailer.Transporter | null = null;
  private adminEmails: string[] = [];

  constructor() {
    this.initializeEmailService();
    this.loadAdminEmails();
  }

  private async initializeEmailService() {
    try {
      // Configure email service based on environment variables
      const emailConfig: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      };

      // Only initialize if credentials are provided
      if (emailConfig.auth.user && emailConfig.auth.pass) {
        this.transporter = nodemailer.createTransport(emailConfig);
        
        // Test the connection
        if (this.transporter) {
          await this.transporter.verify();
        }
        console.log('✅ Email service initialized successfully');
      } else {
        console.log('⚠️ Email credentials not configured. Email notifications disabled.');
        console.log('   Set SMTP_USER and SMTP_PASS environment variables to enable email notifications.');
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      this.transporter = null;
    }
  }

  private async loadAdminEmails() {
    try {
      const admins = await prisma.user.findMany({
        where: { isAdmin: true },
        select: { email: true }
      });
      
      this.adminEmails = admins.map(admin => admin.email);
      console.log(`📧 Loaded ${this.adminEmails.length} admin email(s) for notifications`);
    } catch (error) {
      console.error('❌ Failed to load admin emails:', error);
    }
  }

  private generateEmailContent(data: AdminNotificationData): { subject: string; html: string } {
    const { type, user, session } = data;
    
    let subject = '';
    let html = '';
    
    const baseStyles = `
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .user-info { background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #2196F3; }
        .timestamp { color: #666; font-size: 0.9em; }
      </style>
    `;

    switch (type) {
      case 'user_registration':
        subject = `🎉 New User Registration - ${user.firstName} ${user.lastName}`;
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h2>🎉 New User Registration</h2>
              <p>A new user has joined TuttoPassa!</p>
            </div>
            <div class="content">
              <div class="user-info">
                <h3>👤 User Details</h3>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>Role:</strong> ${user.role === 'TUTO' ? '🎓 Tutor' : '📚 Rookie'}</p>
                <p><strong>University:</strong> ${user.university}</p>
              </div>
              <div class="highlight">
                <p><strong>Total Users:</strong> You now have a new member in your TuttoPassa community!</p>
              </div>
              <p class="timestamp">📅 ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `;
        break;

      case 'session_request':
        subject = `📝 New Session Request - ${user.firstName} ${user.lastName}`;
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h2>📝 New Tutoring Session Request</h2>
              <p>A student has requested help!</p>
            </div>
            <div class="content">
              <div class="user-info">
                <h3>👤 Student Details</h3>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>University:</strong> ${user.university}</p>
              </div>
              ${session ? `
                <div class="highlight">
                  <h3>📚 Session Details</h3>
                  <p><strong>Session ID:</strong> ${session.id}</p>
                  ${session.title ? `<p><strong>Title:</strong> ${session.title}</p>` : ''}
                  ${session.course ? `<p><strong>Course:</strong> ${session.course}</p>` : ''}
                  ${session.startTime ? `<p><strong>Requested Time:</strong> ${session.startTime.toLocaleString()}</p>` : ''}
                </div>
              ` : ''}
              <p class="timestamp">📅 ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `;
        break;

      case 'session_acceptance':
        subject = `✅ Session Accepted - ${user.firstName} ${user.lastName}`;
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h2>✅ Session Accepted</h2>
              <p>A tutor has accepted a session request!</p>
            </div>
            <div class="content">
              <div class="user-info">
                <h3>👨‍🏫 Tutor Details</h3>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>University:</strong> ${user.university}</p>
              </div>
              ${session ? `
                <div class="highlight">
                  <h3>📚 Session Details</h3>
                  <p><strong>Session ID:</strong> ${session.id}</p>
                  ${session.title ? `<p><strong>Title:</strong> ${session.title}</p>` : ''}
                  ${session.course ? `<p><strong>Course:</strong> ${session.course}</p>` : ''}
                </div>
              ` : ''}
              <p class="timestamp">📅 ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `;
        break;

      case 'session_completion':
        subject = `🎯 Session Completed - ${user.firstName} ${user.lastName}`;
        html = `
          ${baseStyles}
          <div class="container">
            <div class="header">
              <h2>🎯 Session Completed</h2>
              <p>A tutoring session has been completed!</p>
            </div>
            <div class="content">
              <div class="user-info">
                <h3>👤 Session Participant</h3>
                <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
                <p><strong>Email:</strong> ${user.email}</p>
                <p><strong>University:</strong> ${user.university}</p>
              </div>
              ${session ? `
                <div class="highlight">
                  <h3>📚 Session Details</h3>
                  <p><strong>Session ID:</strong> ${session.id}</p>
                  ${session.title ? `<p><strong>Title:</strong> ${session.title}</p>` : ''}
                  ${session.course ? `<p><strong>Course:</strong> ${session.course}</p>` : ''}
                </div>
              ` : ''}
              <p class="timestamp">📅 ${new Date().toLocaleString()}</p>
            </div>
          </div>
        `;
        break;
    }

    return { subject, html };
  }

  async sendAdminNotification(data: AdminNotificationData): Promise<void> {
    try {
      if (!this.transporter || this.adminEmails.length === 0) {
        console.log('⚠️ Email notifications not configured or no admin emails found');
        return;
      }

      const { subject, html } = this.generateEmailContent(data);

      const mailOptions = {
        from: `"TuttoPassa Admin" <${process.env.SMTP_USER}>`,
        to: this.adminEmails.join(', '),
        subject,
        html
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Admin notification sent: ${subject}`);
      console.log(`📧 Message ID: ${result.messageId}`);
      
    } catch (error) {
      console.error('❌ Failed to send admin notification:', error);
    }
  }

  // Helper methods for specific notification types
  async notifyUserRegistration(userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          university: { select: { name: true } }
        }
      });

      if (!user) return;

      await this.sendAdminNotification({
        type: 'user_registration',
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          university: user.university.name
        }
      });
    } catch (error) {
      console.error('❌ Failed to send user registration notification:', error);
    }
  }

  async notifySessionRequest(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          rookie: {
            include: { university: { select: { name: true } } }
          },
          course: { select: { title: true, code: true } }
        }
      });

      if (!session || !session.rookie) return;

      await this.sendAdminNotification({
        type: 'session_request',
        user: {
          firstName: session.rookie.firstName,
          lastName: session.rookie.lastName,
          email: session.rookie.email,
          role: session.rookie.role,
          university: session.rookie.university.name
        },
        session: {
          id: session.id,
          title: session.title || undefined,
          course: session.course ? `${session.course.code} - ${session.course.title}` : undefined,
          startTime: session.startTime
        }
      });
    } catch (error) {
      console.error('❌ Failed to send session request notification:', error);
    }
  }

  async notifySessionAcceptance(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          tuto: {
            include: { university: { select: { name: true } } }
          },
          course: { select: { title: true, code: true } }
        }
      });

      if (!session || !session.tuto) return;

      await this.sendAdminNotification({
        type: 'session_acceptance',
        user: {
          firstName: session.tuto.firstName,
          lastName: session.tuto.lastName,
          email: session.tuto.email,
          role: session.tuto.role,
          university: session.tuto.university.name
        },
        session: {
          id: session.id,
          title: session.title || undefined,
          course: session.course ? `${session.course.code} - ${session.course.title}` : undefined
        }
      });
    } catch (error) {
      console.error('❌ Failed to send session acceptance notification:', error);
    }
  }

  async notifySessionCompletion(sessionId: string): Promise<void> {
    try {
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          rookie: {
            include: { university: { select: { name: true } } }
          },
          tuto: {
            include: { university: { select: { name: true } } }
          },
          course: { select: { title: true, code: true } }
        }
      });

      if (!session) return;

      // Notify about both participants
      if (session.rookie) {
        await this.sendAdminNotification({
          type: 'session_completion',
          user: {
            firstName: session.rookie.firstName,
            lastName: session.rookie.lastName,
            email: session.rookie.email,
            role: 'ROOKIE',
            university: session.rookie.university.name
          },
          session: {
            id: session.id,
            title: session.title || undefined,
            course: session.course ? `${session.course.code} - ${session.course.title}` : undefined
          }
        });
      }
    } catch (error) {
      console.error('❌ Failed to send session completion notification:', error);
    }
  }

  // Refresh admin emails (call this when admin status changes)
  async refreshAdminEmails(): Promise<void> {
    await this.loadAdminEmails();
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();
export default EmailNotificationService;
