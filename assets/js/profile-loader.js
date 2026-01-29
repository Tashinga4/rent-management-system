// Profile Loader - Dynamically loads user profile data in navbar
(async function() {
  try {
    const response = await api.getProfile();
    const profile = response.data;
    
    // Update navbar avatar
    const navbarAvatar = document.getElementById('navbarAvatar');
    if (navbarAvatar && profile.avatar) {
      navbarAvatar.src = profile.avatar;
    }
    
    // Update dropdown avatar
    const dropdownAvatar = document.getElementById('dropdownAvatar');
    if (dropdownAvatar && profile.avatar) {
      dropdownAvatar.src = profile.avatar;
    }
    
    // Update dropdown name
    const dropdownName = document.getElementById('dropdownName');
    if (dropdownName && profile.name) {
      dropdownName.textContent = profile.name;
    }
    
    // Update dropdown role
    const dropdownRole = document.getElementById('dropdownRole');
    if (dropdownRole && profile.role) {
      dropdownRole.textContent = profile.role;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
})();
