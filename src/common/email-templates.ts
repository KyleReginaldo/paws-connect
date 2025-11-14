import { StatusChangeEmailDto } from './common.dto';

export function getStatusChangeEmailTemplate(dto: StatusChangeEmailDto): { subject: string; html: string } {
  const { username, newStatus } = dto;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'FULLY_VERIFIED':
        return {
          title: '🎉 Account Fully Verified!',
          message: 'Congratulations! Your account has been fully verified.',
          description: 'You now have complete access to all features on Paws Connect. You can adopt pets, create events, start fundraising campaigns, and enjoy the full experience.',
          color: '#10B981', // green
          icon: '✅'
        };
      case 'SEMI_VERIFIED':
        return {
          title: '📋 Account Semi-Verified',
          message: 'Your account has been semi-verified.',
          description: 'You now have access to basic features. To unlock all features, please complete your verification by submitting additional documents.',
          color: '#3B82F6', // blue
          icon: '📋'
        };
      case 'PENDING':
        return {
          title: '⏳ Account Under Review',
          message: 'Your account status has been updated to pending review.',
          description: 'Our team is reviewing your submitted documents. Please ensure all information is accurate and complete. You may need to resubmit your verification documents.',
          color: '#F59E0B', // amber
          icon: '⏳'
        };
      case 'INDEFINITE':
        return {
          title: '🚫 Account Suspended',
          message: 'Your account has been suspended.',
          description: 'Your account access has been temporarily restricted. If you believe this is an error, please contact our support team for assistance.',
          color: '#EF4444', // red
          icon: '🚫'
        };
      default:
        return {
          title: '📢 Account Status Updated',
          message: 'Your account status has been updated.',
          description: 'Your account status has been changed. Please log in to view your current status and available features.',
          color: '#6B7280', // gray
          icon: '📢'
        };
    }
  };

  const statusInfo = getStatusInfo(newStatus);

  const subject = statusInfo.title;
  
  const html = `
<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${statusInfo.title}</title>
    
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #334155;
            line-height: 1.6;
        }
        
        .email-container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #e0d4c3 0%, #e0d4c3 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
            background-image: url(https://fjogjfdhtszaycqirwpm.supabase.co/storage/v1/object/public/files/bg/fb_bg_tof.jpg);
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            background-color: #e0d4c3;
            height: 200px;
        }
        
        .header h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            color: #1e293b;
        }
        
        .header p {
            font-size: 16px;
            opacity: 0.9;
            margin: 0;
            color: #475569;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 20px;
        }
        
        .message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 24px;
            line-height: 1.7;
        }
        
        .status-card {
            background-color: #f8fafc;
            border: 2px solid ${statusInfo.color}20;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        
        .status-badge {
            display: inline-block;
            background-color: ${statusInfo.color};
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 12px;
        }
        
        .next-steps {
            background-color: #fef7ed;
            border-left: 4px solid #f97316;
            padding: 20px;
            margin: 24px 0;
            border-radius: 0 6px 6px 0;
        }
        
        .next-steps h3 {
            color: #ea580c;
            font-size: 16px;
            margin-bottom: 12px;
            font-weight: 600;
        }
        
        .next-steps p {
            color: #9a3412;
            font-size: 14px;
            margin: 0;
        }
        
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 20px 0;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
        }
        
        .footer {
            background-color: #f1f5f9;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
        }
        
        .footer-content {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
        }
        
        .footer-content a {
            color: #f97316;
            text-decoration: none;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            border-radius: 12px;
            margin-bottom: 16px;
        }
        
        .divider {
            height: 1px;
            background: linear-gradient(to right, transparent, #e2e8f0, transparent);
            margin: 30px 0;
        }
        
        @media (max-width: 600px) {
            .email-container {
                margin: 20px;
                border-radius: 8px;
            }
            .header,
            .content,
            .footer {
                padding: 24px 20px;
            }
            .header h1 {
                font-size: 24px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header"></div>
        
        <div class="content">
            <div class="greeting">Hello ${username || 'there'}!</div>
            
            <div class="message">
                ${statusInfo.message} ${statusInfo.icon}
            </div>
            
            ${newStatus !== 'INDEFINITE' ? `
            <div class="next-steps">
                <h3>What's Next?</h3>
                <p>${getNextStepsText(newStatus)}</p>
            </div>
            ` : ''}
            
            <div style="text-align: center;">
                <a href=${newStatus === 'INDEFINITE' ? 'mailto:pawsconnecttof@gmail.com' : 'https://paws-connect-rho.vercel.app/signin'} class="cta-button">
                    ${newStatus === 'INDEFINITE' ? 'Contact Support' : 'Access Your Account'}
                </a>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <p><strong>Need Help?</strong></p>
                <p>Contact our support team:</p>
                <p>📧 <a href="mailto:pawsconnecttof@gmail.com">pawsconnecttof@gmail.com</a></p>
                <p>📞 +639923189664</p>
                
                <div class="divider"></div>
                
                <p style="margin-top: 20px; font-size: 12px;">
                    © 2025 Paws Connect. All rights reserved.<br />
                    This email was sent because your account status was updated.
                </p>
            </div>
        </div>
    </div>
</body>
</html>`;

  return { subject, html };
}

function getNextStepsText(status: string): string {
  switch (status) {
    case 'FULLY_VERIFIED':
      return 'You can now enjoy all features! Start adopting pets, create events, or support fundraising campaigns.';
    case 'SEMI_VERIFIED':
      return 'Complete your verification by submitting additional documents to unlock all features.';
    case 'PENDING':
      return 'Please wait while we review your documents. Check your email for any additional requirements.';
    default:
      return 'Log in to your account to see your current status and available options.';
  }
}