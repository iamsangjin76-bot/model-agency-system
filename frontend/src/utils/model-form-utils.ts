// Utility functions for ModelFormPage data transformation.
import { Model, ModelType, Gender } from '@/types/model';

/**
 * Pad a partial birth date to a full YYYY-MM-DD for the backend Date column.
 * "1990"       → "1990-01-01"
 * "1990-05"    → "1990-05-01"
 * "1990-05-15" → "1990-05-15"
 * ""  / null   → null
 */
function padBirthDate(val: string | undefined | null): string | null {
  if (!val) return null;
  const parts = val.split('-');
  if (parts.length === 1) return `${parts[0]}-01-01`;
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`;
  return val;
}

// Map API snake_case response to camelCase form data
export function mapApiToForm(data: any): Partial<Model> {
  return {
    name: data.name || '', nameEnglish: data.name_english || '',
    birthDate: data.birth_date || '', gender: data.gender as Gender,
    modelType: (data.model_type as ModelType) || ModelType.NEW_MODEL,
    height: data.height, weight: data.weight, bust: data.bust,
    waist: data.waist, hip: data.hip, shoeSize: data.shoe_size,
    agencyName: data.agency_name || '', agencyPhone: data.agency_phone || '',
    agencyFax: data.agency_fax || '', hasAgency: data.has_agency || false,
    hasManager: data.has_manager || false,
    contact1: data.contact1 || '', contact2: data.contact2 || '',
    contact3: data.contact3 || '', contact4: data.contact4 || '',
    personalContact: data.personal_contact || '', homePhone: data.home_phone || '',
    contactNote: data.contact_note || '',
    school: data.school || '', debut: data.debut || '', hobby: data.hobby || '',
    nationality: data.nationality || '대한민국', passportNo: data.passport_no || '',
    visaType: data.visa_type || '', languages: data.languages || '',
    careerYears: data.career_years, entryDate: data.entry_date || '',
    departureDate: data.departure_date || '',
    careerBroadcast: data.career_broadcast || '', careerMovie: data.career_movie || '',
    careerCommercial: data.career_commercial || '', careerPrintAd: data.career_print_ad || '',
    careerTheater: data.career_theater || '', careerAlbum: data.career_album || '',
    careerMusical: data.career_musical || '', careerFashionShow: data.career_fashion_show || '',
    careerMusicVideo: data.career_music_video || '', careerOther: data.career_other || '',
    modelFee6month: data.model_fee_6month, modelFee1year: data.model_fee_1year,
    currentWorks: data.current_works || '', currentAds: data.current_ads || '',
    instagramId: data.instagram_id || '', instagramFollowers: data.instagram_followers,
    youtubeId: data.youtube_id || '', youtubeSubscribers: data.youtube_subscribers,
    tiktokId: data.tiktok_id || '', tiktokFollowers: data.tiktok_followers,
    keywords: data.keywords || '', memo: data.memo || '',
    isActive: data.is_active !== false,
  };
}

// Build snake_case API payload from camelCase form data
export function buildPayload(f: Partial<Model>): Record<string, any> {
  return {
    name: f.name, name_english: f.nameEnglish,
    birth_date: padBirthDate(f.birthDate as string | undefined), gender: f.gender, model_type: f.modelType,
    height: f.height || null, weight: f.weight || null,
    bust: f.bust || null, waist: f.waist || null, hip: f.hip || null,
    shoe_size: f.shoeSize || null,
    agency_name: f.agencyName, agency_phone: f.agencyPhone, agency_fax: f.agencyFax,
    has_agency: f.hasAgency, has_manager: f.hasManager,
    contact1: f.contact1, contact2: f.contact2, contact3: f.contact3, contact4: f.contact4,
    personal_contact: f.personalContact, home_phone: f.homePhone, contact_note: f.contactNote,
    school: f.school, debut: f.debut, hobby: f.hobby,
    nationality: f.nationality, passport_no: f.passportNo, visa_type: f.visaType,
    languages: f.languages, career_years: f.careerYears || null,
    entry_date: f.entryDate || null, departure_date: f.departureDate || null,
    career_broadcast: f.careerBroadcast, career_movie: f.careerMovie,
    career_commercial: f.careerCommercial, career_print_ad: f.careerPrintAd,
    career_theater: f.careerTheater, career_album: f.careerAlbum,
    career_musical: f.careerMusical, career_fashion_show: f.careerFashionShow,
    career_music_video: f.careerMusicVideo, career_other: f.careerOther,
    model_fee_6month: f.modelFee6month || null, model_fee_1year: f.modelFee1year || null,
    current_works: f.currentWorks, current_ads: f.currentAds,
    instagram_id: f.instagramId, instagram_followers: f.instagramFollowers || null,
    youtube_id: f.youtubeId, youtube_subscribers: f.youtubeSubscribers || null,
    tiktok_id: f.tiktokId, tiktok_followers: f.tiktokFollowers || null,
    keywords: f.keywords, memo: f.memo, is_active: f.isActive,
  };
}
