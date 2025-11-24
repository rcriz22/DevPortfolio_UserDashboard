import React, { useEffect, useState } from "react";
import { getProfile } from "../api";
import "../styles/profile.css";

export default function Profile({onUserUpdate} ) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
    role: "",
    currentPassword: "",
    newPassword: ""
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("https://localhost:3000/api/me", {
          credentials: "include"
        });
        if (!res.ok) throw new Error("Failed to fetch profile");

        const data = await res.json();
        setProfile(data.user);
        setFormData({
          username: data.user.username || "",
          email: data.user.email || "",
          bio: data.user.bio || "",
          role: data.user.role || "User",
          currentPassword: "",
          newPassword: ""
        });
      } catch (err) {
        console.error(err);
        setError("Failed to fetch profile. Are you logged in?");
      }
    };

    fetchProfile();
  }, []);

  if (error) return <div className="profile-error">{error}</div>;
  if (!profile) return <div className="profile-loading">Loading profile...</div>;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Send verification code ---
  const handleSendVerificationCode = async () => {
    setMessage("");
    try {
      const res = await fetch("https://localhost:3000/api/email/send-code", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: formData.email })
      });
      const data = await res.json();
      if (data.error) setMessage(data.error);
      else setMessage("Verification code sent! Check your email.");
      setIsVerifying(true); // Show input for code
    } catch (err) {
      console.error(err);
      setMessage("Failed to send verification code.");
    }
  };

  // --- Verify email ---
  const handleVerifyCode = async () => {
  if (!verificationCode) return setMessage("Please enter the code.");
  try {
    const res = await fetch("https://localhost:3000/api/email/verify", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: verificationCode })
    });
    const data = await res.json();

    if (data.error) {
      setMessage(data.error);
      return;
    }

    // Update profile with verified email
    setProfile(prev => ({
      ...prev,
      email: data.email,
      isVerified: true
    }));
    setMessage("Email verified successfully!");
    setIsVerifying(false);
    setVerificationCode("");
  } catch (err) {
    console.error(err);
    setMessage("Failed to verify code.");
  }
};

  // --- Update profile ---
  const handleUpdateProfile = async (e) => {
  e.preventDefault();
  setMessage("");
  try {
    const body = { username: formData.username, email: formData.email, bio: formData.bio };
    if (profile.role === "Admin") body.role = formData.role;

    const res = await fetch("https://localhost:3000/api/update-profile", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
      return;
    }

   if (data.user) {
      setProfile({
        username: data.user.username,
        email: data.user.email,
        bio: data.user.bio,
        role: data.user.role,   
        isVerified: data.user.isVerified
      });

      setFormData(prev => ({
        ...prev,
        username: data.user.username,
        email: data.user.email,
        bio: data.user.bio,
        role: data.user.role
      }));
    }

    setMessage(data.message || "Profile updated successfully!");

    if (onUserUpdate) onUserUpdate(data.user);

      } catch (err) {
        console.error(err);
        setMessage("Failed to update profile.");
      }
    };

  // --- Change password ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("https://localhost:3000/api/change-password", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });
      const data = await res.json();
      setMessage(data.error || data.message || "Password change response received.");
      setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
    } catch (err) {
      console.error(err);
      setMessage("Failed to change password.");
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>Welcome, {profile.username}</h1>
        <p>This is your secure developer profile. Your role determines what you can access and manage.</p>
      </header>

      <section className="profile-details">
        <p><strong>Email:</strong> {profile.email}{" "}
          {profile.isVerified ? (
            <span style={{ color: "green" }}>✔ Verified</span>
          ) : (
            <span style={{ color: "red" }}>✖ Not Verified</span>
          )}
        </p>
        <p><strong>Role:</strong> {profile.role}</p>
        <p><strong>Bio:</strong> {profile?.bio || "No bio added yet."}</p>
      </section>

      <section className="profile-update-form">
        <h2>Update Profile</h2>
        {message && <p className="update-message">{message}</p>}

        <form onSubmit={handleUpdateProfile}>
          <label>
            Username:
            <input type="text" name="username" value={formData.username} onChange={handleChange} required />
          </label>

          <label>
            Email:
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>

          {!profile.isVerified && (
            <>
              <button type="button" onClick={handleSendVerificationCode}>Send Verification Code</button>
              {isVerifying && (
                <>
                  <input
                    type="text"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                  <button type="button" onClick={handleVerifyCode}>Verify Code</button>
                </>
              )}
            </>
          )}

          <label>
            Bio:
            <textarea name="bio" value={formData.bio} onChange={handleChange} maxLength={500} />
          </label>

          {profile.role === "Admin" && (
            <label>
              Role:
              <select name="role" value={formData.role} onChange={handleChange}>
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="Editor">Editor</option>
                <option value="Viewer">Viewer</option>
                <option value="Contributor">Contributor</option>
              </select>
            </label>
          )}

          <button type="submit">Update Profile</button>
        </form>

        <h3>Change Password</h3>
        <form onSubmit={handleChangePassword}>
          <label>
            Current Password:
            <input type="password" name="currentPassword" value={formData.currentPassword} onChange={handleChange} required />
          </label>

          <label>
            New Password:
            <input type="password" name="newPassword" value={formData.newPassword} onChange={handleChange} minLength={6} required />
          </label>

          <button type="submit">Change Password</button>
        </form>
      </section>
    </div>
  );
}
