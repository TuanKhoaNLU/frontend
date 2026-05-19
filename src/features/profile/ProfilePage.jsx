import { useState, useEffect } from "react";
import apiClient from "../../api/client";
import "./ProfilePage.css";

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mimi",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Buster",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Salem",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Casper",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Abby",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Pepper",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Chloe",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Loki",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Garfield",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Bella",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Simba",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Nala"
];

function ProfilePage({ isLoggedIn }) {
  const [profile, setProfile] = useState({
    username: "",
    fullName: "",
    phoneNumber: "",
    avatarUrl: "",
    avatarFile: null,
    role: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [showIllustrations, setShowIllustrations] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchProfile = async () => {
      try {
        const response = await apiClient.get("/users/profile");
        setProfile({
          username: response.data.username || "",
          fullName: response.data.fullName || "",
          phoneNumber: response.data.phoneNumber || "",
          avatarUrl: response.data.avatarUrl || "",
          role: response.data.role || ""
        });
      } catch (err) {
        setError("Failed to load user information.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [isLoggedIn]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError("Image is too large. Please select an image under 2MB.");
        return;
      }
      setProfile(prev => ({
        ...prev,
        avatarFile: file,
        avatarUrl: URL.createObjectURL(file)
      }));
      setShowIllustrations(false);
    }
  };

  const handlePredefinedAvatarSelect = (url) => {
    setProfile(prev => ({ ...prev, avatarUrl: url, avatarFile: null }));
    setShowIllustrations(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    setError(null);

    try {
      const formData = new FormData();
      if (profile.fullName) formData.append("fullName", profile.fullName);
      if (profile.phoneNumber) formData.append("phoneNumber", profile.phoneNumber);
      
      if (profile.avatarFile) {
        formData.append("avatarFile", profile.avatarFile);
      } else if (profile.avatarUrl && !profile.avatarUrl.startsWith("blob:")) {
        // Chỉ gửi avatarUrl nếu nó là Dicebear hoặc Cloudinary URL (không gửi URL object cục bộ)
        formData.append("avatarUrl", profile.avatarUrl);
      }

      await apiClient.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessage("Profile updated successfully!");
    } catch (err) {
      setError(err?.response?.data?.message || "An error occurred while updating.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoggedIn) return <div className="profile-wrap"><p>Please log in to view your profile.</p></div>;
  if (isLoading) return <div className="profile-wrap"><p>Loading data...</p></div>;

  return (
    <div className="profile-wrap">
      <section className="profile-card">
        <p className="profile-eyebrow">Account</p>
        <h2 className="profile-title">Personal Information</h2>
        
        <form className="profile-form" onSubmit={handleSubmit}>
          <div className="profile-avatar-section">
            <div className="profile-avatar-preview">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : (profile.username ? profile.username.charAt(0).toUpperCase() : "U")}
                </div>
              )}
            </div>
            <div className="profile-avatar-upload">
              <div className="profile-avatar-actions">
                <label htmlFor="avatar-upload" className="profile-upload-btn">
                  Upload Photo
                </label>
                <button 
                  type="button" 
                  className={`profile-upload-btn ${showIllustrations ? 'active' : ''}`}
                  onClick={() => setShowIllustrations(!showIllustrations)}
                >
                  Choose Illustration
                </button>
              </div>
              
              <input 
                id="avatar-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: "none" }} 
              />
              <p className="profile-avatar-hint">JPG or PNG formats under 2MB, or choose an illustration.</p>
            </div>
          </div>

          {showIllustrations && (
            <div className="profile-illustrations-container">
              <p className="profile-illustrations-title">Select an Illustration</p>
              <div className="profile-illustrations-grid">
                {PREDEFINED_AVATARS.map((url, idx) => (
                  <button 
                    key={idx} 
                    type="button"
                    className={`profile-illustration-item ${profile.avatarUrl === url ? 'selected' : ''}`}
                    onClick={() => handlePredefinedAvatarSelect(url)}
                  >
                    <img src={url} alt={`Illustration ${idx}`} />
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="profile-label">
            Email / Username
            <input
              className="profile-input profile-input--readonly"
              type="text"
              value={profile.username}
              readOnly
            />
          </label>

          <label className="profile-label">
            Full Name
            <input
              className="profile-input"
              type="text"
              name="fullName"
              placeholder="Enter your full name"
              value={profile.fullName}
              onChange={handleInputChange}
            />
          </label>

          <label className="profile-label">
            Phone Number
            <input
              className="profile-input"
              type="tel"
              name="phoneNumber"
              placeholder="Enter your phone number"
              value={profile.phoneNumber}
              onChange={handleInputChange}
            />
          </label>

          <button className="profile-button" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {message && <p className="profile-message success">{message}</p>}
        {error && <p className="profile-message error">{error}</p>}
      </section>
    </div>
  );
}

export default ProfilePage;
