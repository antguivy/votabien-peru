export interface HitoBasic {
  id: number;
  title: string;
  date: Date;
  description: string | null;
  location: string | null;
  photo_url: string | null;
  registration_url: string | null;
  is_published: boolean;
  index: number | null;
  label: string | null;
}
