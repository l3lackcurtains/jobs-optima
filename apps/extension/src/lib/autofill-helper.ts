import { logger } from './logger';

interface Profile {
  profileName?: string;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    github?: string;
    personalWebsite?: string;
    twitter?: string;
    street?: string;
    apartment?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    pronouns?: string;
    customPronouns?: string;
  };
  experience?: any[];
  education?: any[];
  skills?: {
    technicalSkills?: string[];
    developmentPracticesMethodologies?: string[];
    personalSkills?: string[];
    softSkills?: string[];
  };
  professionalSummary?: string;
  objective?: string;
  totalYearsExperience?: number;
  currentSalary?: number;
  desiredSalary?: number;
  workAuthorization?: string;
  requiresSponsorship?: boolean;
  availableStartDate?: Date | string;
  preferredWorkTypes?: string[];
  preferredJobTypes?: string[];
  achievements?: string[];
  
  // Job application specific fields
  currentCompany?: string;
  salaryExpectations?: string;
  intendSecondaryEmployment?: boolean;
  previouslyWorkedAtCompany?: boolean;
  coverLetter?: string;
  distributedSystemsExperience?: string;
  golangProficiency?: string;
  adtechExperience?: boolean;
  livesInUSOrCanada?: boolean;
  
  // EEO Information
  authorizedToWorkInUS?: boolean;
  ethnicity?: string[];
  gender?: string;
  sexualOrientation?: string;
  disabilities?: string[];
  veteranStatus?: string;
}

// Field mapping configuration for different ATS platforms
const ATS_FIELD_MAPPINGS = {
  // Common field selectors that work across most ATS platforms
  common: {
    // Name fields
    fullName: [
      '[name*="name"]:not([name*="company"]):not([name*="user"]):not([name*="emergency"]):not([name*="file"]):not([type="file"])',
      '[placeholder*="full name" i]',
      '[placeholder*="your name" i]',
      '[placeholder*="name" i]:not([placeholder*="company" i]):not([placeholder*="user" i])',
      '[aria-label*="full name" i]',
      '[aria-label*="your name" i]',
      '[aria-label*="name" i]:not([aria-label*="company" i])',
      '[id*="fullname" i]',
      '[id*="full_name" i]',
      '[id*="name" i]:not([id*="company" i]):not([id*="user" i])',
      '[data-testid*="name"]',
      '[data-field="name"]',
      '[data-automation-id="name"]',
      '[name="candidate_name"]',
      '[name="applicant_name"]',
      '[name="name"]',
      'input[autocomplete="name"]',
      'input[title*="name" i]',
      '.applicant-name input',
      '.candidate-name input',
      'label:has-text("Name") + input',
      'label:has-text("Full Name") + input',
      '#name',
    ],
    firstName: [
      // ID-based selectors (most specific)
      '#firstname',  // Common pattern without underscore or camelCase
      '#firstName',
      '#first_name',
      '#first-name',
      '#fname',
      '[id="firstname"]',
      '[id="firstName"]',
      '[id="first_name"]',
      '[id="first-name"]',
      
      // Name attribute selectors
      '[name="firstname"]',
      '[name="firstName"]',
      '[name="first_name"]',
      '[name="first-name"]',
      '[name="fname"]',
      '[name="first"]',
      '[name="givenName"]',
      '[name="given-name"]',
      '[name="given_name"]',
      
      // Data attributes
      '[data-ui="firstname"]',
      '[data-ui="firstName"]',
      '[data-ui="first_name"]',
      '[data-field="firstname"]',
      '[data-field="firstName"]',
      '[data-automation-id="firstname"]',
      '[data-automation-id="firstName"]',
      '[data-testid*="first" i][data-testid*="name" i]',
      '[data-testid="firstname"]',
      '[data-testid="firstName"]',
      
      // Partial matches with name attribute
      '[name*="first" i][name*="name" i]',
      '[name*="fname" i]',
      '[name^="first" i]:not([name*="last" i])',
      
      // Placeholder-based
      '[placeholder*="first name" i]',
      '[placeholder*="first" i]:not([placeholder*="last" i])',
      '[placeholder="First Name"]',
      '[placeholder="First"]',
      
      // Aria labels
      '[aria-label*="first name" i]',
      '[aria-label*="first" i]:not([aria-label*="last" i])',
      '[aria-labelledby*="firstname" i]',
      
      // Autocomplete
      'input[autocomplete="given-name"]',
      
      // Title attribute
      'input[title*="first" i][title*="name" i]',
      'input[title="First Name"]',
      
      // Class-based (less reliable but sometimes useful)
      '.first-name input',
      '.firstname input',
      'input.first-name',
      'input.firstname',
      
      // Label adjacent selectors
      'label:has-text("First Name") + input',
      'label:has-text("First") + input',
    ],
    lastName: [
      // ID-based selectors (most specific)
      '#lastname',  // Common pattern without underscore or camelCase
      '#lastName',
      '#last_name',
      '#last-name',
      '#lname',
      '#surname',
      '[id="lastname"]',
      '[id="lastName"]',
      '[id="last_name"]',
      '[id="last-name"]',
      '[id="surname"]',
      
      // Name attribute selectors
      '[name="lastname"]',
      '[name="lastName"]',
      '[name="last_name"]',
      '[name="last-name"]',
      '[name="lname"]',
      '[name="last"]',
      '[name="surname"]',
      '[name="familyName"]',
      '[name="family-name"]',
      '[name="family_name"]',
      
      // Data attributes
      '[data-ui="lastname"]',
      '[data-ui="lastName"]',
      '[data-ui="last_name"]',
      '[data-field="lastname"]',
      '[data-field="lastName"]',
      '[data-automation-id="lastname"]',
      '[data-automation-id="lastName"]',
      '[data-testid*="last" i][data-testid*="name" i]',
      '[data-testid="lastname"]',
      '[data-testid="lastName"]',
      
      // Partial matches with name attribute
      '[name*="last" i][name*="name" i]',
      '[name*="lname" i]',
      '[name^="last" i]:not([name*="first" i])',
      '[name*="surname" i]',
      
      // Placeholder-based
      '[placeholder*="last name" i]',
      '[placeholder*="last" i]:not([placeholder*="first" i])',
      '[placeholder*="surname" i]',
      '[placeholder="Last Name"]',
      '[placeholder="Last"]',
      '[placeholder="Surname"]',
      
      // Aria labels
      '[aria-label*="last name" i]',
      '[aria-label*="last" i]:not([aria-label*="first" i])',
      '[aria-label*="surname" i]',
      '[aria-labelledby*="lastname" i]',
      
      // Autocomplete
      'input[autocomplete="family-name"]',
      
      // Title attribute
      'input[title*="last" i][title*="name" i]',
      'input[title="Last Name"]',
      'input[title="Surname"]',
      
      // Class-based
      '.last-name input',
      '.lastname input',
      'input.last-name',
      'input.lastname',
      
      // Label adjacent selectors
      'label:has-text("Last Name") + input',
      'label:has-text("Last") + input',
      'label:has-text("Surname") + input',
    ],
    
    // Contact fields
    email: [
      // Type-specific selector (most reliable for email)
      'input[type="email"]',
      
      // ID-based
      '#email',
      '#emailaddress',
      '#email-address',
      '#email_address',
      '[id="email"]',
      '[id="emailaddress"]',
      '[id="emailAddress"]',
      '[id="email_address"]',
      '[id="email-address"]',
      
      // Name attribute
      '[name="email"]',
      '[name="emailaddress"]',
      '[name="emailAddress"]',
      '[name="email_address"]',
      '[name="email-address"]',
      '[name="mail"]',
      '[name="e-mail"]',
      
      // Data attributes
      '[data-ui="email"]',
      '[data-field="email"]',
      '[data-automation-id="email"]',
      '[data-testid="email"]',
      
      // Partial matches
      '[name*="email" i]:not([type="hidden"])',
      '[name*="mail" i]:not([name*="mail" i][name*="list" i])',
      
      // Placeholder
      '[placeholder*="email" i]',
      '[placeholder*="@" i]',
      '[placeholder="Email"]',
      '[placeholder="Email Address"]',
      
      // Aria
      '[aria-label*="email" i]',
      '[aria-labelledby*="email" i]',
      
      // Autocomplete
      'input[autocomplete="email"]',
      'input[autocomplete="username"][type="email"]',
      
      // Class-based
      '.email-field input',
      '.email input',
      'input.email',
    ],
    phone: [
      // Type-specific selector
      'input[type="tel"]',
      
      // ID-based
      '#phone',
      '#phonenumber',
      '#phone-number',
      '#phone_number',
      '#telephone',
      '#mobile',
      '#mobilenumber',
      '#cell',
      '[id="phone"]',
      '[id="phonenumber"]',
      '[id="phoneNumber"]',
      '[id="phone_number"]',
      '[id="phone-number"]',
      '[id="telephone"]',
      '[id="mobile"]',
      
      // Name attribute
      '[name="phone"]',
      '[name="phonenumber"]',
      '[name="phoneNumber"]',
      '[name="phone_number"]',
      '[name="phone-number"]',
      '[name="telephone"]',
      '[name="tel"]',
      '[name="mobile"]',
      '[name="mobilenumber"]',
      '[name="mobileNumber"]',
      '[name="mobile_number"]',
      '[name="cell"]',
      '[name="cellphone"]',
      
      // Data attributes
      '[data-ui="phone"]',
      '[data-ui="telephone"]',
      '[data-field="phone"]',
      '[data-automation-id="phone"]',
      '[data-testid="phone"]',
      
      // Partial matches
      '[name*="phone" i]:not([type="hidden"])',
      '[name*="mobile" i]:not([type="hidden"])',
      '[name*="tel" i]:not([name*="hotel" i]):not([name*="motel" i])',
      '[name*="cell" i]:not([name*="excel" i])',
      
      // Placeholder
      '[placeholder*="phone" i]',
      '[placeholder*="mobile" i]',
      '[placeholder*="(___) ___-____"]',
      '[placeholder*="###-###-####"]',
      '[placeholder="Phone"]',
      '[placeholder="Phone Number"]',
      '[placeholder="Mobile"]',
      
      // Aria
      '[aria-label*="phone" i]',
      '[aria-label*="mobile" i]',
      '[aria-label*="telephone" i]',
      '[aria-labelledby*="phone" i]',
      
      // Autocomplete
      'input[autocomplete="tel"]',
      'input[autocomplete="tel-national"]',
      'input[autocomplete="mobile"]',
      
      // Class-based
      '.phone-field input',
      '.phone input',
      '.telephone input',
      '.mobile input',
      'input.phone',
      'input.telephone',
    ],
    
    // Address fields
    street: [
      '[name*="street" i]',
      '[name*="address1" i]',
      '[name*="address_1" i]',
      '[name*="address" i]:not([name*="2"]):not([name*="email"])',
      '[placeholder*="street address" i]',
      '[placeholder*="address line 1" i]',
      '[aria-label*="street" i]',
      '[id*="street" i]',
      '[id*="address1" i]',
      'input[autocomplete="address-line1"]',
      '.street-address input',
      '#streetAddress',
    ],
    apartment: [
      '[name*="apt" i]',
      '[name*="apartment" i]',
      '[name*="suite" i]',
      '[name*="address2" i]',
      '[name*="address_2" i]',
      '[placeholder*="apt" i]',
      '[placeholder*="apartment" i]',
      '[placeholder*="address line 2" i]',
      '[aria-label*="apartment" i]',
      '[id*="apartment" i]',
      '[id*="address2" i]',
      'input[autocomplete="address-line2"]',
      '.apartment-field input',
    ],
    city: [
      '[name*="city" i]',
      '[placeholder*="city" i]',
      '[aria-label*="city" i]',
      '[id*="city" i]',
      '[data-testid*="city"]',
      'input[autocomplete="address-level2"]',
      '.city-field input',
      '#city',
    ],
    state: [
      '[name*="state" i]',
      '[name*="province" i]',
      '[placeholder*="state" i]',
      '[aria-label*="state" i]',
      '[id*="state" i]',
      '[data-testid*="state"]',
      'select[name*="state" i]',
      'input[autocomplete="address-level1"]',
      '.state-field select',
      '.state-field input',
      '#state',
    ],
    zipCode: [
      '[name*="zip" i]',
      '[name*="postal" i]',
      '[name*="postcode" i]',
      '[placeholder*="zip" i]',
      '[placeholder*="postal" i]',
      '[aria-label*="zip" i]',
      '[id*="zip" i]',
      '[id*="postal" i]',
      '[data-testid*="zip"]',
      'input[autocomplete="postal-code"]',
      '.zip-field input',
      '#zipCode',
    ],
    country: [
      '[name*="country" i]',
      '[placeholder*="country" i]',
      '[aria-label*="country" i]',
      '[id*="country" i]',
      '[data-testid*="country"]',
      'select[name*="country" i]',
      'input[autocomplete="country-name"]',
      '.country-field select',
      '.country-field input',
      '#country',
    ],
    
    // Location/Current Location (composite field)
    location: [
      '[name*="location" i]:not([name*="preferred"])',
      '[name*="current_location" i]',
      '[name*="currentLocation" i]',
      '[placeholder*="location" i]:not([placeholder*="preferred"])',
      '[placeholder*="current location" i]',
      '[placeholder*="city, state" i]',
      '[aria-label*="location" i]:not([aria-label*="preferred"])',
      '[aria-label*="current location" i]',
      '[id*="location" i]:not([id*="preferred"])',
      '[name="residence"]',
      '[data-testid*="location"]',
      '.location-field input',
      '#currentLocation',
    ],
    
    // Social links
    linkedin: [
      '[name*="linkedin" i]',
      '[placeholder*="linkedin" i]',
      '[aria-label*="linkedin" i]',
      '[id*="linkedin" i]',
      '[data-testid*="linkedin"]',
      'input[type="url"][placeholder*="linkedin" i]',
      'input[placeholder*="linkedin.com" i]',
      '[name="linkedinUrl"]',
      '[name="linkedin_url"]',
      '[name="linkedInProfile"]',
      '.linkedin-field input',
      '#linkedin',
    ],
    github: [
      '[name*="github" i]',
      '[placeholder*="github" i]',
      '[aria-label*="github" i]',
      '[id*="github" i]',
      '[data-testid*="github"]',
      'input[type="url"][placeholder*="github" i]',
      'input[placeholder*="github.com" i]',
      '[name="githubUrl"]',
      '[name="github_url"]',
      '[name="githubProfile"]',
      '.github-field input',
      '#github',
    ],
    twitter: [
      '[name*="twitter" i]',
      '[placeholder*="twitter" i]',
      '[aria-label*="twitter" i]',
      '[id*="twitter" i]',
      '[data-testid*="twitter"]',
      'input[placeholder*="twitter.com" i]',
      '[name="twitterUrl"]',
      '[name="twitter_url"]',
      '.twitter-field input',
    ],
    website: [
      '[name*="website" i]',
      '[name*="portfolio" i]',
      '[name*="personal" i][name*="site" i]',
      '[placeholder*="website" i]',
      '[placeholder*="portfolio" i]',
      '[aria-label*="website" i]',
      '[aria-label*="portfolio" i]',
      '[id*="website" i]',
      '[id*="portfolio" i]',
      '[data-testid*="website"]',
      'input[type="url"]:not([name*="linkedin"]):not([name*="github"]):not([name*="twitter"])',
      '[name="websiteUrl"]',
      '[name="website_url"]',
      '[name="portfolioUrl"]',
      '.website-field input',
      '#website',
    ],
    
    // Professional fields
    summary: [
      '[name*="summary" i]',
      '[name*="about" i]',
      '[name*="bio" i]',
      '[placeholder*="summary" i]',
      '[placeholder*="about yourself" i]',
      '[aria-label*="summary" i]',
      '[id*="summary" i]',
      '[data-testid*="summary"]',
      'textarea[name*="summary" i]',
      'textarea[placeholder*="tell us about" i]',
      '.summary-field textarea',
      '#professionalSummary',
    ],
    yearsExperience: [
      '[name*="years" i][name*="experience" i]',
      '[name*="total" i][name*="experience" i]',
      '[name*="experience" i][name*="years" i]',
      '[placeholder*="years of experience" i]',
      '[aria-label*="years of experience" i]',
      '[id*="yearsExperience" i]',
      '[data-testid*="yearsExperience"]',
      'select[name*="experience" i]',
      'input[type="number"][name*="experience" i]',
      '.years-experience-field input',
      '.years-experience-field select',
    ],
    currentSalary: [
      '[name*="current" i][name*="salary" i]',
      '[name*="current" i][name*="compensation" i]',
      '[placeholder*="current salary" i]',
      '[aria-label*="current salary" i]',
      '[id*="currentSalary" i]',
      '[data-testid*="currentSalary"]',
      'input[type="number"][name*="current" i]',
      '.current-salary-field input',
    ],
    desiredSalary: [
      '[name*="desired" i][name*="salary" i]',
      '[name*="expected" i][name*="salary" i]',
      '[name*="salary" i][name*="expectation" i]',
      '[placeholder*="desired salary" i]',
      '[placeholder*="expected salary" i]',
      '[aria-label*="desired salary" i]',
      '[id*="desiredSalary" i]',
      '[data-testid*="desiredSalary"]',
      'input[type="number"][name*="desired" i]',
      'input[type="number"][name*="expected" i]',
      '.desired-salary-field input',
    ],
    
    // Work authorization
    workAuthorization: [
      '[name*="work" i][name*="authorization" i]',
      '[name*="work" i][name*="status" i]',
      '[name*="authorization" i][name*="status" i]',
      '[name*="visa" i][name*="status" i]',
      '[aria-label*="work authorization" i]',
      '[id*="workAuthorization" i]',
      '[data-testid*="workAuthorization"]',
      'select[name*="authorization" i]',
      'select[name*="visa" i]',
      '.work-auth-field select',
      '#workAuth',
    ],
    requiresSponsorship: [
      '[name*="sponsor" i]',
      '[name*="visa" i][name*="sponsor" i]',
      '[aria-label*="sponsorship" i]',
      '[id*="sponsorship" i]',
      '[data-testid*="sponsorship"]',
      'input[type="checkbox"][name*="sponsor" i]',
      'input[type="radio"][name*="sponsor" i]',
      'select[name*="sponsor" i]',
      '.sponsorship-field input',
    ],
    
    // EEO fields
    gender: [
      '[name*="gender" i]',
      '[aria-label*="gender" i]',
      '[id*="gender" i]',
      '[data-testid*="gender"]',
      'select[name*="gender" i]',
      'input[type="radio"][name*="gender" i]',
      '.gender-field select',
    ],
    race: [
      '[name*="race" i]',
      '[name*="ethnicity" i]',
      '[aria-label*="race" i]',
      '[aria-label*="ethnicity" i]',
      '[id*="race" i]',
      '[id*="ethnicity" i]',
      '[data-testid*="race"]',
      'select[name*="race" i]',
      'select[name*="ethnicity" i]',
      '.race-field select',
    ],
    veteranStatus: [
      '[name*="veteran" i]',
      '[aria-label*="veteran" i]',
      '[id*="veteran" i]',
      '[data-testid*="veteran"]',
      'select[name*="veteran" i]',
      'input[type="radio"][name*="veteran" i]',
      '.veteran-field select',
    ],
    disabilityStatus: [
      '[name*="disability" i]',
      '[name*="disabled" i]',
      '[aria-label*="disability" i]',
      '[id*="disability" i]',
      '[data-testid*="disability"]',
      'select[name*="disability" i]',
      'input[type="radio"][name*="disability" i]',
      'input[type="checkbox"][name*="disability" i]',
      '.disability-field select',
    ],
    
    // Job application specific fields
    currentCompany: [
      '[name*="current" i][name*="company" i]',
      '[name*="current" i][name*="employer" i]',
      '[name*="employer" i]',
      '[placeholder*="current company" i]',
      '[placeholder*="current employer" i]',
      '[aria-label*="current company" i]',
      '[id*="currentCompany" i]',
      '[data-testid*="currentCompany"]',
      '.current-company input',
    ],
    
    pronouns: [
      '[name*="pronoun" i]',
      '[placeholder*="pronoun" i]',
      '[aria-label*="pronoun" i]',
      '[id*="pronoun" i]',
      '[data-testid*="pronoun"]',
      'select[name*="pronoun" i]',
      '.pronoun-field select',
    ],
    
    coverLetter: [
      '[name*="cover" i][name*="letter" i]',
      '[name*="additional" i][name*="information" i]',
      '[name*="additional" i]',
      '[placeholder*="cover letter" i]',
      '[placeholder*="additional information" i]',
      '[placeholder*="anything else" i]',
      '[aria-label*="cover letter" i]',
      '[id*="coverLetter" i]',
      'textarea[name*="cover" i]',
      'textarea[name*="additional" i]',
      '.cover-letter textarea',
      '.additional-info textarea',
    ],
    
    secondaryEmployment: [
      '[name*="secondary" i][name*="employment" i]',
      '[name*="other" i][name*="employment" i]',
      '[name*="advisory" i]',
      '[name*="volunteer" i]',
      '[aria-label*="secondary employment" i]',
      '[id*="secondaryEmployment" i]',
      'input[type="radio"][name*="secondary" i]',
      'input[type="checkbox"][name*="secondary" i]',
      'select[name*="secondary" i]',
    ],
    
    previousEmployee: [
      '[name*="previous" i][name*="work" i]',
      '[name*="previously" i][name*="employed" i]',
      '[name*="worked" i][name*="before" i]',
      '[aria-label*="previously worked" i]',
      '[id*="previousEmployee" i]',
      'input[type="radio"][name*="previous" i]',
      'select[name*="previous" i]',
    ],
    
    distributedSystems: [
      '[name*="distributed" i][name*="system" i]',
      '[name*="large" i][name*="scale" i]',
      '[placeholder*="distributed systems" i]',
      '[aria-label*="distributed systems" i]',
      '[id*="distributedSystems" i]',
      'select[name*="distributed" i]',
    ],
    
    golangExperience: [
      '[name*="golang" i]',
      '[name*="go" i][name*="proficiency" i]',
      '[name*="go" i][name*="experience" i]',
      '[placeholder*="golang" i]',
      '[aria-label*="golang" i]',
      '[id*="golang" i]',
      'select[name*="golang" i]',
      'select[name*="go" i]',
    ],
    
    adtechExperience: [
      '[name*="adtech" i]',
      '[name*="ad" i][name*="tech" i]',
      '[name*="advertising" i][name*="technology" i]',
      '[aria-label*="adtech" i]',
      '[id*="adtech" i]',
      'input[type="radio"][name*="adtech" i]',
      'select[name*="adtech" i]',
    ],
    
    locationPreference: [
      '[name*="live" i][name*="canada" i]',
      '[name*="live" i][name*="us" i]',
      '[name*="reside" i][name*="canada" i]',
      '[name*="location" i][name*="preference" i]',
      '[aria-label*="live in canada" i]',
      '[aria-label*="live in us" i]',
      '[id*="locationPreference" i]',
      'input[type="radio"][name*="location" i]',
      'select[name*="location" i]',
    ],
  },
  
  // Platform-specific mappings (can be extended for specific ATS systems)
  workday: {
    // Workday-specific selectors
    fullName: ['[data-automation-id="name"]', '[data-automation-id="legalFullName"]'],
    email: ['[data-automation-id="email"]'],
    phone: ['[data-automation-id="phone"]'],
  },
  
  greenhouse: {
    // Greenhouse-specific selectors
    fullName: ['#first_name', '#last_name'],
    email: ['#email'],
    phone: ['#phone'],
  },
  
  lever: {
    // Lever-specific selectors
    fullName: ['input[name="name"]'],
    email: ['input[name="email"]'],
    phone: ['input[name="phone"]'],
  },
  
  taleo: {
    // Taleo-specific selectors
    fullName: ['.formfield input[name*="name"]'],
    email: ['.formfield input[name*="email"]'],
  },
};

// Enhanced autofill function with better field detection and filling
export const autofillForms = (profile: Profile) => {
  const normalize = (str: string) => str?.toLowerCase().trim() || "";
  
  // Detect which ATS platform we're on
  const detectATS = (): string => {
    const url = window.location.href.toLowerCase();
    const bodyText = document.body.innerText.toLowerCase();
    
    if (url.includes('workday') || bodyText.includes('workday')) return 'workday';
    if (url.includes('greenhouse') || bodyText.includes('greenhouse')) return 'greenhouse';
    if (url.includes('lever') || bodyText.includes('lever.co')) return 'lever';
    if (url.includes('taleo') || bodyText.includes('taleo')) return 'taleo';
    if (url.includes('bamboohr') || bodyText.includes('bamboohr')) return 'bamboohr';
    if (url.includes('icims') || bodyText.includes('icims')) return 'icims';
    
    return 'common';
  };
  
  const atsType = detectATS();
  logger.log(`Detected ATS platform: ${atsType}`);
  
  // Get selectors for the detected ATS, falling back to common selectors
  const getSelectors = (fieldName: string): string[] => {
    const platformSelectors = (ATS_FIELD_MAPPINGS as any)[atsType]?.[fieldName] || [];
    const commonSelectors = ATS_FIELD_MAPPINGS.common[fieldName as keyof typeof ATS_FIELD_MAPPINGS.common] || [];
    return [...platformSelectors, ...commonSelectors];
  };
  
  // Enhanced field filling with better event handling
  const fillField = (
    selectors: string[],
    value: string | number | boolean | undefined,
    fieldName?: string
  ): boolean => {
    if (value === undefined || value === null || value === '') return false;
    
    const strValue = String(value).trim();
    let filled = false;
    
    for (const selector of selectors) {
      try {
        // Handle special selector syntax for labels
        if (selector.includes('label:has-text')) {
          const labelText = selector.match(/"([^"]+)"/)?.[1];
          if (labelText) {
            const labels = document.querySelectorAll('label');
            labels.forEach(label => {
              if (label.textContent?.toLowerCase().includes(labelText.toLowerCase())) {
                const input = label.nextElementSibling as HTMLInputElement;
                if (input && (input.tagName === 'INPUT' || input.tagName === 'TEXTAREA')) {
                  if (!input.disabled && !input.readOnly && !filled) {
                    input.value = strValue;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    filled = true;
                    logger.log(`✓ Filled ${fieldName || selector} via label: ${strValue.substring(0, 50)}`);
                  }
                }
              }
            });
          }
          continue;
        }
        
        const elements = document.querySelectorAll(selector);
        
        elements.forEach((element: any) => {
          if (!element || element.disabled || element.readOnly || filled) return;
          
          // Skip hidden or invisible elements
          const style = window.getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return;
          
          const tag = element.tagName.toLowerCase();
          const type = element.type?.toLowerCase();
          
          // Handle different input types
          if (tag === 'input' || tag === 'textarea') {
            // Check if it's a valid text input type
            const validTypes = ['text', 'email', 'tel', 'url', 'search', 'number', 'date', 'password', undefined, ''];
            if (!validTypes.includes(type)) return;
            
            // Skip password fields unless explicitly meant for them
            if (type === 'password' && !fieldName?.toLowerCase().includes('password')) return;
            
            // Skip if already has the same value
            if (element.value && normalize(element.value) === normalize(strValue)) return;
            
            // Format value based on input type
            let finalValue = strValue;
            if (type === 'url' && finalValue && !/^https?:\/\//i.test(finalValue)) {
              finalValue = 'https://' + finalValue.replace(/^\/\//, '');
            }
            if (type === 'date' && typeof value === 'object' && value !== null && 'toISOString' in value) {
              finalValue = (value as Date).toISOString().split('T')[0];
            } else if (type === 'date' && typeof value === 'string') {
              // If it's already a string date, use it as is
              finalValue = value;
            }
            
            // Set value and trigger events
            element.value = finalValue;
            
            // Trigger multiple events to ensure compatibility
            ['input', 'change', 'blur'].forEach(eventType => {
              const event = new Event(eventType, { bubbles: true, cancelable: true });
              element.dispatchEvent(event);
            });
            
            // For React-based forms
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              'value'
            )?.set;
            
            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(element, finalValue);
              const inputEvent = new Event('input', { bubbles: true });
              element.dispatchEvent(inputEvent);
            }
            
            filled = true;
            logger.log(`✓ Filled ${fieldName || selector}: ${finalValue.substring(0, 50)}${finalValue.length > 50 ? '...' : ''}`);
          }
          
          // Handle select dropdowns
          else if (tag === 'select') {
            const targetNorm = normalize(strValue);
            let matchIndex = -1;
            
            // Try exact match first
            for (let i = 0; i < element.options.length; i++) {
              const optText = normalize(element.options[i].text);
              const optValue = normalize(element.options[i].value);
              
              if (optText === targetNorm || optValue === targetNorm) {
                matchIndex = i;
                break;
              }
            }
            
            // Try partial match
            if (matchIndex === -1) {
              for (let i = 0; i < element.options.length; i++) {
                const optText = normalize(element.options[i].text);
                const optValue = normalize(element.options[i].value);
                
                if (optText.includes(targetNorm) || targetNorm.includes(optText) ||
                    optValue.includes(targetNorm) || targetNorm.includes(optValue)) {
                  matchIndex = i;
                  break;
                }
              }
            }
            
            if (matchIndex !== -1) {
              element.selectedIndex = matchIndex;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              filled = true;
              logger.log(`✓ Selected ${fieldName || selector}: ${element.options[matchIndex].text}`);
            }
          }
          
          // Handle radio buttons and checkboxes
          else if (tag === 'input' && (type === 'radio' || type === 'checkbox')) {
            if (type === 'checkbox' && typeof value === 'boolean') {
              element.checked = value;
              element.dispatchEvent(new Event('change', { bubbles: true }));
              filled = true;
              logger.log(`✓ Checked ${fieldName || selector}: ${value}`);
            } else if (type === 'radio') {
              // For radio buttons, check if the value matches
              const radioValue = normalize(element.value);
              const radioLabel = element.labels?.[0]?.innerText ? normalize(element.labels[0].innerText) : '';
              
              if (radioValue === normalize(strValue) || radioLabel.includes(normalize(strValue))) {
                element.checked = true;
                element.dispatchEvent(new Event('change', { bubbles: true }));
                filled = true;
                logger.log(`✓ Selected radio ${fieldName || selector}: ${element.value}`);
              }
            }
          }
        });
      } catch (error) {
        console.error(`Error filling field with selector ${selector}:`, error);
      }
    }
    
    if (!filled && fieldName) {
      logger.log(`✗ Could not find field for ${fieldName}`);
    }
    
    return filled;
  };
  
  logger.log('Starting autofill with profile:', profile.profileName || 'Unnamed Profile');
  logger.log('Profile data:', profile);
  logger.log('Page URL:', window.location.href);
  
  // First, detect what fields are available on the page
  const detectedFields = detectFormFields();
  logger.log('Detected fields on page:', Object.keys(detectedFields));
  
  if (profile.contactInfo) {
    const ci = profile.contactInfo;
    
    // Fill name fields - try multiple strategies
    if (ci.name) {
      // Strategy 1: Try full name field
      const fullNameFilled = fillField(getSelectors('fullName'), ci.name, 'Full Name');
      
      // Strategy 2: Try first/last name split
      if (!fullNameFilled) {
        const nameParts = ci.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
        
        const firstNameFilled = fillField(getSelectors('firstName'), firstName, 'First Name');
        const lastNameFilled = fillField(getSelectors('lastName'), lastName, 'Last Name');
        
        // Strategy 3: If only last name field exists, put full name there
        if (!firstNameFilled && !lastNameFilled) {
          fillField(getSelectors('lastName'), ci.name, 'Last Name (Full)');
        }
      }
    }
    
    // Fill contact information
    fillField(getSelectors('email'), ci.email, 'Email');
    fillField(getSelectors('phone'), ci.phone, 'Phone');
    
    // Fill address fields
    if (ci.street) fillField(getSelectors('street'), ci.street, 'Street Address');
    if (ci.apartment) fillField(getSelectors('apartment'), ci.apartment, 'Apartment/Suite');
    if (ci.city) fillField(getSelectors('city'), ci.city, 'City');
    if (ci.state) fillField(getSelectors('state'), ci.state, 'State');
    if (ci.zipCode) fillField(getSelectors('zipCode'), ci.zipCode, 'Zip Code');
    if (ci.country) fillField(getSelectors('country'), ci.country, 'Country');
    
    // Fill composite location field (if individual fields weren't found)
    if (ci.location) {
      fillField(getSelectors('location'), ci.location, 'Current Location');
    } else if (ci.city && ci.state) {
      // Create location string from components
      const locationStr = `${ci.city}, ${ci.state}`;
      fillField(getSelectors('location'), locationStr, 'Current Location');
    }
    
    // Fill social links
    if (ci.linkedin) fillField(getSelectors('linkedin'), ci.linkedin, 'LinkedIn');
    if (ci.github) fillField(getSelectors('github'), ci.github, 'GitHub');
    if (ci.twitter) fillField(getSelectors('twitter'), ci.twitter, 'Twitter');
    if (ci.personalWebsite) fillField(getSelectors('website'), ci.personalWebsite, 'Website/Portfolio');
  }
  
  // Fill professional information
  if (profile.professionalSummary) {
    fillField(getSelectors('summary'), profile.professionalSummary, 'Professional Summary');
  }
  
  if (profile.totalYearsExperience !== undefined) {
    fillField(getSelectors('yearsExperience'), profile.totalYearsExperience, 'Years of Experience');
  }
  
  if (profile.currentSalary !== undefined) {
    fillField(getSelectors('currentSalary'), profile.currentSalary, 'Current Salary');
  }
  
  if (profile.desiredSalary !== undefined) {
    fillField(getSelectors('desiredSalary'), profile.desiredSalary, 'Desired Salary');
  }
  
  // Fill work authorization
  if (profile.workAuthorization) {
    fillField(getSelectors('workAuthorization'), profile.workAuthorization, 'Work Authorization');
  }
  
  if (profile.requiresSponsorship !== undefined) {
    fillField(getSelectors('requiresSponsorship'), profile.requiresSponsorship, 'Requires Sponsorship');
  }
  
  // Fill job application specific fields
  if (profile.currentCompany) fillField(getSelectors('currentCompany'), profile.currentCompany, 'Current Company');
  if (profile.coverLetter) fillField(getSelectors('coverLetter'), profile.coverLetter, 'Cover Letter');
  if (profile.intendSecondaryEmployment !== undefined) fillField(getSelectors('secondaryEmployment'), profile.intendSecondaryEmployment, 'Secondary Employment');
  if (profile.previouslyWorkedAtCompany !== undefined) fillField(getSelectors('previousEmployee'), profile.previouslyWorkedAtCompany, 'Previously Worked Here');
  if (profile.distributedSystemsExperience) fillField(getSelectors('distributedSystems'), profile.distributedSystemsExperience, 'Distributed Systems Experience');
  if (profile.golangProficiency) fillField(getSelectors('golangExperience'), profile.golangProficiency, 'Golang Proficiency');
  if (profile.adtechExperience !== undefined) fillField(getSelectors('adtechExperience'), profile.adtechExperience, 'Adtech Experience');
  if (profile.livesInUSOrCanada !== undefined) fillField(getSelectors('locationPreference'), profile.livesInUSOrCanada, 'Lives in US/Canada');
  
  // Fill contact pronouns
  if (profile.contactInfo?.pronouns) {
    const pronounsValue = profile.contactInfo.pronouns === 'custom' && profile.contactInfo.customPronouns 
      ? profile.contactInfo.customPronouns 
      : profile.contactInfo.pronouns;
    fillField(getSelectors('pronouns'), pronounsValue, 'Pronouns');
  }

  // Fill EEO information (if provided)
  if (profile.gender) fillField(getSelectors('gender'), profile.gender, 'Gender');
  if (profile.ethnicity && profile.ethnicity.length > 0) {
    // For ethnicity, we might need to handle multiple selections
    profile.ethnicity.forEach(ethnicity => {
      fillField(getSelectors('race'), ethnicity, 'Race/Ethnicity');
    });
  }
  if (profile.veteranStatus) fillField(getSelectors('veteranStatus'), profile.veteranStatus, 'Veteran Status');
  if (profile.sexualOrientation) fillField(getSelectors('sexualOrientation'), profile.sexualOrientation, 'Sexual Orientation');
  if (profile.disabilities && profile.disabilities.length > 0) {
    // Handle multiple disability selections
    profile.disabilities.forEach(disability => {
      fillField(getSelectors('disabilityStatus'), disability, 'Disability Status');
    });
  }
  
  // Fill skills (if there's a skills textarea)
  if (profile.skills) {
    const allSkills = [
      ...(profile.skills.technicalSkills || []),
      ...(profile.skills.developmentPracticesMethodologies || []),
      ...(profile.skills.personalSkills || []),
      ...(profile.skills.softSkills || [])
    ];
    
    if (allSkills.length > 0) {
      const skillsText = allSkills.join(', ');
      const skillsSelectors = [
        '[name*="skills" i]',
        '[placeholder*="skills" i]',
        '[aria-label*="skills" i]',
        '[id*="skills" i]',
        'textarea[name*="skills" i]',
        'textarea[placeholder*="skills" i]',
      ];
      fillField(skillsSelectors, skillsText, 'Skills');
    }
  }
  
  logger.log('Autofill completed!');
  
  // Return stats about what was filled
  const filledCount = document.querySelectorAll('input[value]:not([value=""]), textarea:not(:empty), select:not([selectedIndex="0"])').length;
  return {
    success: true,
    fieldsAttempted: Object.keys(ATS_FIELD_MAPPINGS.common).length,
    fieldsFilled: filledCount,
    atsDetected: atsType
  };
};

// Export helper function to test field detection
export const detectFormFields = () => {
  const detectedFields: Record<string, string[]> = {};
  
  Object.entries(ATS_FIELD_MAPPINGS.common).forEach(([fieldName, selectors]) => {
    const foundElements: string[] = [];
    
    selectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach((el: any) => {
            const identifier = el.name || el.id || el.placeholder || selector;
            if (!foundElements.includes(identifier)) {
              foundElements.push(identifier);
            }
          });
        }
      } catch (e) {
        // Invalid selector, skip
      }
    });
    
    if (foundElements.length > 0) {
      detectedFields[fieldName] = foundElements;
    }
  });
  
  logger.log('Detected form fields:', detectedFields);
  return detectedFields;
};