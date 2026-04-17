import defaultProfileImage from '../assets/default-profile.svg';

export const getProfileImageSrc = (pictureUrl) => pictureUrl || defaultProfileImage;

export const handleProfileImageError = (event) => {
  if (event.currentTarget.src === defaultProfileImage) {
    return;
  }

  event.currentTarget.src = defaultProfileImage;
};

export { defaultProfileImage };
