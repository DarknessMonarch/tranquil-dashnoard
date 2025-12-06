"use client";

import styles from "@/app/styles/email.module.css";
import { useAuthStore } from "@/app/store/AuthStore";
import { useAdminStore } from "@/app/store/AdminStore";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Loader from "@/app/components/StateLoader";
import { IoAdd as AddIcon } from "react-icons/io5";
import { IoClose as ExitIcon } from "react-icons/io5";
import { IoMail as EmailIcon } from "react-icons/io5";
import { MdFormatBold as BoldIcon } from "react-icons/md";
import { MdFormatItalic as ItalicIcon } from "react-icons/md";
import { MdFormatUnderlined as UnderlineIcon } from "react-icons/md";

export default function AdminEmails() {
  const { sendBulkEmail, users, getAllUsers } = useAdminStore();
  const { isAdmin } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(false);
  const [style, setStyle] = useState('');
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAdmin) {
      getAllUsers();
    }
  }, [isAdmin, getAllUsers]);

  const allUsers = users.filter(u => u.emailVerified);
  const proUsers = users.filter(u => u.emailVerified && u.currentTier === 'pro');
  const eliteUsers = users.filter(u => u.emailVerified && u.currentTier === 'elite');

  const postEmail = async () => {
    if (!emails.length || !subject || !message) {
      toast.error('Please enter all required fields');
      return;
    }

    if (!isAdmin) {
      toast.error('Admin access required');
      return;
    }

    setIsLoading(true);

    try {
      const result = await sendBulkEmail(emails, subject, message);

      if (result.success) {
        toast.success(result.message || 'Emails sent successfully');
        setMessage('');
        setSubject('');
        setEmails([]);
      } else {
        toast.error(result.message || 'Failed to send emails');
      }
    } catch (error) {
      console.error('Email sending error:', error);
      toast.error('An error occurred while sending emails');
    } finally {
      setIsLoading(false);
    }
  };

  const removeEmail = (emailToRemove) => {
    setEmails(emails.filter(e => e !== emailToRemove));
  };

  const addEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email) {
      const newEmails = email.split(',').map((e) => e.trim());
      const isValid = newEmails.every((e) => emailRegex.test(e));

      if (isValid) {
        setEmails([...emails, ...newEmails]);
        setEmail('');
      } else {
        toast.error('Please enter valid email addresses');
      }
    } else {
      toast.error('Please enter an email address');
    }
  };

  const addAllUsers = () => {
    const allUserEmails = allUsers
      .map(user => user.email)
      .filter(email => !emails.includes(email));
    setEmails([...emails, ...allUserEmails]);
    toast.success(`Added ${allUserEmails.length} users`);
  };

  const addProUsers = () => {
    const proUserEmails = proUsers
      .map(user => user.email)
      .filter(email => !emails.includes(email));
    setEmails([...emails, ...proUserEmails]);
    toast.success(`Added ${proUserEmails.length} Pro users`);
  };

  const addEliteUsers = () => {
    const eliteUserEmails = eliteUsers
      .map(user => user.email)
      .filter(email => !emails.includes(email));
    setEmails([...emails, ...eliteUserEmails]);
    toast.success(`Added ${eliteUserEmails.length} Elite users`);
  };

  const textBold = () => setStyle(style === 'bold' ? '' : 'bold');
  const textItalic = () => setStyle(style === 'italic' ? '' : 'italic');
  const textUnderline = () => setStyle(style === 'underline' ? '' : 'underline');

  return (
    <div className={styles.emailContainer}>
      <div className={styles.emailTop}>
        <div className={styles.emailInputContainer}>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Add email addresses (comma separated)" 
            className={styles.emailInput}
            onKeyPress={(e) => e.key === 'Enter' && addEmail()}
          />
          <button 
            onClick={addEmail} 
            className={styles.emailButton} 
            type="button"
            disabled={isLoading}
          >
            <AddIcon className={styles.addIcon} />
          </button>
        </div>

        <div className={styles.quickAddButtons}>
          <button 
            onClick={addAllUsers}
            className={styles.quickAddBtn}
            disabled={isLoading || !allUsers.length}
          >
            All Verified ({allUsers.length})
          </button>
          <button 
            onClick={addProUsers}
            className={styles.quickAddBtn}
            disabled={isLoading || !proUsers.length}
          >
            Pro Users ({proUsers.length})
          </button>
          <button 
            onClick={addEliteUsers}
            className={styles.quickAddBtn}
            disabled={isLoading || !eliteUsers.length}
          >
            Elite Users ({eliteUsers.length})
          </button>
        </div>
      </div>

      <div className={styles.emailBottom}>
        <div className={styles.emailContent}>
          <div className={styles.emailArea}>
            <h2>From</h2>
            <div className={styles.areaInner}>
              <span>Tranquil Admin</span>
            </div>
          </div>

          <div className={styles.emailArea}>
            <div className={styles.areaHeader}>
              <h2>To</h2>
              <h2>Recipients: {emails.length}</h2>
            </div>
            
            <div className={styles.recipientsContainer}>
              {emails.length > 0 ? (
                <div className={styles.recipientsList}>
                  {emails.map((recipientEmail, index) => (
                    <div key={index} className={styles.recipientItem}>
                      <span>{recipientEmail}</span>
                      <ExitIcon 
                        className={styles.removeIcon} 
                        onClick={() => removeEmail(recipientEmail)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noRecipients}>
                  <span>No recipients selected</span>
                </div>
              )}
            </div>

            <input 
              type="text" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email Subject" 
              className={styles.emailInput}
              disabled={isLoading}
            />

            <div className={styles.messageContainer}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Your email message..."
                className={`${styles.emailTextarea} ${
                  style === 'bold' ? styles.textBold :
                  style === 'italic' ? styles.textItalic :
                  style === 'underline' ? styles.textUnderline : ''
                }`}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className={styles.emailActions}>
          <div className={styles.emailExtra}>
            <button 
              className={`${styles.extraButton} ${style === 'bold' ? styles.active : ''}`}
              onClick={textBold}
              disabled={isLoading}
              title="Bold"
            >
              <BoldIcon className={styles.extraIcon} />
            </button>
            <button 
              className={`${styles.extraButton} ${style === 'underline' ? styles.active : ''}`}
              onClick={textUnderline}
              disabled={isLoading}
              title="Underline"
            >
              <UnderlineIcon className={styles.extraIcon} />
            </button>
            <button 
              className={`${styles.extraButton} ${style === 'italic' ? styles.active : ''}`}
              onClick={textItalic}
              disabled={isLoading}
              title="Italic"
            >
              <ItalicIcon className={styles.extraIcon} />
            </button>
          </div>

          <button 
            onClick={postEmail}
            className={styles.emailSubmit}
            disabled={isLoading || !emails.length || !subject || !message}
          >
            <span>{isLoading ? <Loader /> : 'Send Email'}</span>
            <EmailIcon className={styles.submitIcon} />
          </button>
        </div>
      </div>
    </div>
  );
}
