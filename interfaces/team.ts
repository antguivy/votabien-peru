export interface TeamBasic {
  id: string;
  first_name: string;
  last_name: string;
  image_url: string | null;
  phrase: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  is_principal: boolean;
  email: string | null;
  role: string;
}
