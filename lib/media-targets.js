import { listings } from '../site/content.js';

export const mediaListings = [...listings.events, ...listings.stays];
export function validMediaTarget(kind, id) {
  if (kind === 'listing') return mediaListings.some(item => item.id === id);
  if (kind === 'demo') return listings.online.some(item => item.id === id);
  return false;
}
