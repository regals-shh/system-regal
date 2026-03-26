const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail');
const crypto = require('crypto');
const dotenv = require('dotenv');

// MODELS
const Tenant = require('../models/Tenant');
const Admin = require('../models/Admin');
const PasswordReset = require('../models/PasswordReset');
const bcrypt = require('bcryptjs');

// Load environment variables from parent directory
dotenv.config({ path: require('path').join(__dirname, '../', '.env') });

// Email configuration
const EMAIL_USER = (process.env.EMAIL_USER || process.env.GMAIL_EMAIL || 'regalsapartment@gmail.com').trim();
const SENDGRID_API_KEY = process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '';

console.log('Email configuration:');
console.log('  From:', EMAIL_USER);
console.log('  API Key configured:', !!SENDGRID_API_KEY);

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY && SENDGRID_API_KEY.startsWith('SG.')) {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('SendGrid HTTP API configured');
} else {
    console.warn('WARNING: SendGrid API key not configured. Password reset emails will not work.');
}

// Generate 6-digit reset code
const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send password reset email
const sendResetEmail = async (email, resetCode, userType) => {
    try {
        console.log(`Attempting to send reset email to ${email}...`);
        console.log(`From: ${EMAIL_USER}`);
        
        const subject = `Password Reset Code - Regal Rooms ${userType === 'admin' ? 'Admin' : 'Tenant'} Account`;
        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #14532D; font-family: 'DM Serif Display', serif;">Regal Rooms</h1>
                    <p style="color: #bba97d; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">${userType === 'admin' ? 'Admin' : 'Tenant'} Portal</p>
                </div>
                
                <div style="background: #F8F6F1; padding: 30px; border-radius: 15px; margin-bottom: 20px;">
                    <h2 style="color: #14532D; margin-bottom: 15px;">Password Reset Request</h2>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                        You requested to reset your password for your ${userType === 'admin' ? 'admin' : 'tenant'} account. 
                        Use the verification code below to proceed with the password reset.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 10px; text-align: center; border: 2px solid #bba97d;">
                        <p style="color: #888; font-size: 14px; margin-bottom: 10px;">Your Verification Code:</p>
                        <h1 style="color: #14532D; font-size: 32px; letter-spacing: 8px; margin: 0;">${resetCode}</h1>
                    </div>
                    
                    <p style="color: #888; font-size: 12px; margin-top: 20px;">
                        This code will expire in <strong>10 minutes</strong>. If you didn't request this, please ignore this email.
                    </p>
                </div>
                
                <div style="text-align: center; color: #999; font-size: 12px;">
                    <p> 2024 Regal Rooms. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        `;

        // Send via SendGrid HTTP API (works on Render)
        console.log('Using SendGrid HTTP API to send email...');
        const msg = {
            to: email,
            from: {
                email: EMAIL_USER,
                name: 'Regal Rooms'
            },
            subject: subject,
            html: htmlContent
        };
        
        await sgMail.send(msg);
        console.log('Email sent successfully via SendGrid');
        return { success: true };
    } catch (error) {
        console.error('Email sending error:', error);
        if (error.response) {
            console.error('SendGrid error details:', error.response.body);
        }
        throw error;
    }
};

// Debug endpoint to check email configuration
router.get('/debug-email', async (req, res) => {
    try {
        // Test transporter connection
        let transporterReady = false;
        let transporterError = null;
        
        if (transporter && transporter.verify) {
            try {
                await new Promise((resolve, reject) => {
                    transporter.verify((err, success) => {
                        if (err) reject(err);
                        else resolve(success);
                    });
                });
                transporterReady = true;
            } catch (err) {
                transporterError = err.message;
            }
        }
        
        res.json({
            EMAIL_HOST: process.env.EMAIL_HOST || 'not set',
            EMAIL_PORT: process.env.EMAIL_PORT || 'not set',
            EMAIL_USER: process.env.EMAIL_USER || process.env.GMAIL_EMAIL || 'not set',
            EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD ? 'configured' : 'not set',
            GMAIL_EMAIL: process.env.GMAIL_EMAIL || 'not set',
            GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD ? 'configured' : 'not set',
            transporter_configured: !!transporter && !!transporter.sendMail,
            transporter_ready: transporterReady,
            transporter_error: transporterError,
            processed_email_user: EMAIL_USER,
            processed_password_length: EMAIL_APP_PASSWORD ? EMAIL_APP_PASSWORD.length : 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Test email endpoint - actually tries to send an email
router.get('/test-email', async (req, res) => {
    try {
        if (!EMAIL_USER || !SENDGRID_API_KEY) {
            return res.status(500).json({ 
                error: 'Email not configured',
                EMAIL_USER: !!EMAIL_USER,
                SENDGRID_API_KEY: !!SENDGRID_API_KEY
            });
        }
        
        const testCode = generateResetCode();
        
        const msg = {
            to: EMAIL_USER,
            from: {
                email: EMAIL_USER,
                name: 'Regal Rooms Test'
            },
            subject: 'Test Email from Regal Rooms',
            html: `<h1>Test Email</h1><p>This is a test. Code: ${testCode}</p>`
        };
        
        console.log('Attempting to send test email...');
        console.log('From:', EMAIL_USER);
        
        await sgMail.send(msg);
        
        res.json({
            success: true,
            message: 'Test email sent successfully',
            to: EMAIL_USER
        });
    } catch (error) {
        console.error('Test email error:', error);
        if (error.response) {
            console.error('SendGrid error:', error.response.body);
        }
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response ? error.response.body : null
        });
    }
});

// POST /api/auth/forgot-password-tenant
router.post('/forgot-password-tenant', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if tenant exists
        const tenant = await Tenant.findOne({ email: email.toLowerCase() });
        if (!tenant) {
            return res.status(404).json({ message: 'No tenant account found with this email' });
        }

        // Generate reset code
        const resetCode = generateResetCode();

        // Delete any existing reset codes for this email
        await PasswordReset.deleteMany({ email: email.toLowerCase(), userType: 'tenant' });

        // Store new reset code
        const passwordReset = new PasswordReset({
            email: email.toLowerCase(),
            resetCode,
            userType: 'tenant'
        });
        await passwordReset.save();

        // Send reset email
        try {
            console.log('Tenant forgot password: Sending email to', email);
            await sendResetEmail(email, resetCode, 'tenant');
            console.log('Tenant reset email sent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to send tenant reset email:', emailError);
            return res.status(500).json({ 
                message: 'Failed to send reset email. Please try again.',
                error: emailError.message 
            });
        }

        res.json({ 
            message: 'Password reset code sent to your email',
            email: email
        });

    } catch (error) {
        console.error('Forgot password tenant error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/forgot-password-admin
router.post('/forgot-password-admin', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if admin exists
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return res.status(404).json({ message: 'No admin account found with this email' });
        }

        // Generate reset code
        const resetCode = generateResetCode();

        // Delete any existing reset codes for this email
        await PasswordReset.deleteMany({ email: email.toLowerCase(), userType: 'admin' });

        // Store new reset code
        const passwordReset = new PasswordReset({
            email: email.toLowerCase(),
            resetCode,
            userType: 'admin'
        });
        await passwordReset.save();

        // Send reset email
        try {
            console.log('Admin forgot password: Sending email to', email);
            await sendResetEmail(email, resetCode, 'admin');
            console.log('Admin reset email sent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to send admin reset email:', emailError);
            return res.status(500).json({ 
                message: 'Failed to send reset email. Please try again.',
                error: emailError.message 
            });
        }

        res.json({ 
            message: 'Password reset code sent to your email',
            email: email
        });

    } catch (error) {
        console.error('Forgot password admin error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/verify-reset-code
router.post('/verify-reset-code', async (req, res) => {
    try {
        const { email, resetCode, userType } = req.body;

        if (!email || !resetCode || !userType) {
            return res.status(400).json({ message: 'Email, reset code, and user type are required' });
        }

        // Find valid reset code
        const passwordReset = await PasswordReset.findOne({
            email: email.toLowerCase(),
            resetCode,
            userType
        });

        if (!passwordReset) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        res.json({ 
            message: 'Reset code verified successfully',
            email: email,
            userType: userType
        });

    } catch (error) {
        console.error('Verify reset code error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, resetCode, userType, newPassword } = req.body;

        if (!email || !resetCode || !userType || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Find and validate reset code
        const passwordReset = await PasswordReset.findOne({
            email: email.toLowerCase(),
            resetCode,
            userType
        });

        if (!passwordReset) {
            return res.status(400).json({ message: 'Invalid or expired reset code' });
        }

        // Update password based on user type
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (userType === 'tenant') {
            await Tenant.updateOne(
                { email: email.toLowerCase() },
                { password: hashedPassword }
            );
        } else if (userType === 'admin') {
            await Admin.updateOne(
                { email: email.toLowerCase() },
                { password: hashedPassword }
            );
        }

        // Delete the used reset code
        await PasswordReset.deleteOne({ _id: passwordReset._id });

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error. Please try again.' });
    }
});

module.exports = router;