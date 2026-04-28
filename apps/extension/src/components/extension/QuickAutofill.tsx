import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Sparkles,
  RefreshCw,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Star,
  Twitter,
} from 'lucide-react';
import { autofillForms } from '@/lib/autofill-helper';
import { STORAGE_KEYS } from '@/lib/constants';
import { makeAuthenticatedRequest } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Profile {
  _id: string;
  profileName: string;
  isDefault: boolean;
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
    preferredFirstName?: string;
  };
  experience: any[];
  education: any[];
  skills: {
    technicalSkills: string[];
    developmentPracticesMethodologies: string[];
    personalSkills: string[];
    softSkills?: string[];
  };
  professionalSummary?: string;
  objective?: string;
  totalYearsExperience?: number;
  currentSalary?: number;
  desiredSalary?: number;
  workAuthorization?: string;
  requiresSponsorship?: boolean;
  availableStartDate?: Date;
  preferredWorkTypes?: string[];
  preferredJobTypes?: string[];
  achievements?: string[];
  
  // Job application specific fields
  currentCompany?: string;
  currentLocation?: string;
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

interface QuickAutofillProps {
  isAuthenticated: boolean;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function QuickAutofill({ isAuthenticated, onError, onSuccess }: QuickAutofillProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [copiedText, setCopiedText] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      loadProfiles();
    }
  }, [isAuthenticated]);

  const loadProfiles = async () => {
    setIsLoadingProfiles(true);
    setError('');
    
    try {
      // Fetch user profiles
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        isActive: 'true'
      });

      const response = await makeAuthenticatedRequest(`/profiles?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch profiles');
      }

      const result = await response.json();
      const userProfiles = result.data || [];
      
      setProfiles(userProfiles);
      
      // Auto-select default profile if available
      const defaultProfile = userProfiles.find((p: Profile) => p.isDefault);
      if (defaultProfile) {
        setSelectedProfile(defaultProfile);
      }
      
      if (userProfiles.length === 0) {
        setError('No profiles found. Please create a profile first.');
      }
    } catch (err: any) {
      console.error('Error loading profiles:', err);
      setError(err.message || 'Failed to load profiles');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    const profile = profiles.find(p => p._id === profileId);
    setSelectedProfile(profile || null);
  };

  const copyToClipboard = async (text: string, label?: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      onSuccess(`${label || 'Text'} copied to clipboard!`);
      setTimeout(() => setCopiedText(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      onError('Failed to copy to clipboard');
    }
  };

  const handleAutofill = async () => {
    if (!selectedProfile) {
      onError('Please select a profile first');
      return;
    }

    setIsAutofilling(true);

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab.id) {
        throw new Error('No active tab found');
      }

      // Show loading state
      onSuccess('Analyzing form fields... This may take a few seconds.');
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (profile: any) => {
          try {
            // Convert profile to simple format
            const nameParts = profile.contactInfo.name.split(' ');
            const data = {
              firstName: nameParts[0] || '',
              lastName: nameParts.slice(1).join(' ') || '',
              email: profile.contactInfo.email,
              phone: profile.contactInfo.phone,
              company: profile.currentCompany || '',
              currentCompany: profile.currentCompany || '',
              currentLocation: profile.currentLocation || '',
              linkedin: profile.contactInfo.linkedin || '',
              github: profile.contactInfo.github || '',
              portfolio: profile.contactInfo.personalWebsite || '',
              twitter: profile.contactInfo.twitter || '',
              coverLetter: profile.coverLetter || '',
              preferredFirstName: profile.contactInfo.preferredFirstName || '',
              street: profile.contactInfo.street || '',
              city: profile.contactInfo.city || '',
              state: profile.contactInfo.state || '',
              zipCode: profile.contactInfo.zipCode || '',
              country: profile.contactInfo.country || '',
              location: profile.contactInfo.location || '',
              currentSalary: profile.currentSalary?.toString() || '',
              desiredSalary: profile.desiredSalary?.toString() || profile.salaryExpectations || '',
              workAuthorization: profile.workAuthorization || '',
              requiresSponsorship: profile.requiresSponsorship || false,
              availableStartDate: profile.availableStartDate ? new Date(profile.availableStartDate).toLocaleDateString() : '',
              gender: profile.gender === 'male' ? 'Male' : 
                     profile.gender === 'female' ? 'Female' : 
                     'Prefer not to say',
              ethnicity: Array.isArray(profile.ethnicity) ? profile.ethnicity.join(', ') : (profile.ethnicity || ''),
              race: Array.isArray(profile.ethnicity) ? profile.ethnicity.join(', ') : (profile.ethnicity || ''),
              veteran: profile.veteranStatus || 'Prefer not to say',
              disability: Array.isArray(profile.disabilities) ? 
                (profile.disabilities.length > 0 && !profile.disabilities.includes('no disabilities') ? 'Yes' : 'No') : 
                'Prefer not to say'
            };

            // Detect ATS - more comprehensive detection
            const url = window.location.href.toLowerCase();
            const hostname = window.location.hostname.toLowerCase();
            const pageTitle = document.title.toLowerCase();
            
            let ats = 'generic';
            if (hostname.includes('greenhouse') || url.includes('greenhouse') || pageTitle.includes('greenhouse')) {
              ats = 'greenhouse';
            } else if (hostname.includes('workable') || url.includes('workable')) {
              ats = 'workable';
            } else if (hostname.includes('lever') || url.includes('lever')) {
              ats = 'lever';
            } else if (hostname.includes('workday') || url.includes('workday')) {
              ats = 'workday';
            } else if (hostname.includes('bamboohr') || hostname.includes('bamboo')) {
              ats = 'bamboohr';
            } else if (hostname.includes('smartrecruiters')) {
              ats = 'smartrecruiters';
            } else if (hostname.includes('jobvite')) {
              ats = 'jobvite';
            } else if (hostname.includes('icims')) {
              ats = 'icims';
            } else if (hostname.includes('taleo')) {
              ats = 'taleo';
            } else if (hostname.includes('ashbyhq') || hostname.includes('ashby')) {
              ats = 'ashby';
            }

            // Visual feedback function
            function addVisualFeedback(element) {
              element.style.border = '2px solid #10b981';
              element.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
              
              const removeHighlight = () => {
                element.style.border = '';
                element.style.backgroundColor = '';
                element.removeEventListener('input', removeHighlight);
                element.removeEventListener('change', removeHighlight);
              };
              
              element.addEventListener('input', removeHighlight, { once: true });
              element.addEventListener('change', removeHighlight, { once: true });
            }

            // Enhanced fill field function
            function fillField(element, value) {
              try {
                if (!value || !element) return false;
                
                // Handle different input types
                if (element.type === 'checkbox' || element.type === 'radio') {
                  element.checked = Boolean(value);
                } else if (element.tagName === 'SELECT') {
                  // For select elements, only fill if we can find a matching option
                  const options = Array.from(element.options);
                  
                  // Try different matching strategies
                  let matchingOption = options.find(opt => 
                    opt.value.toLowerCase() === value.toLowerCase() ||
                    opt.text.toLowerCase() === value.toLowerCase()
                  );
                  
                  // Try partial matching
                  if (!matchingOption) {
                    matchingOption = options.find(opt => 
                      opt.text.toLowerCase().includes(value.toLowerCase()) ||
                      value.toLowerCase().includes(opt.text.toLowerCase())
                    );
                  }
                  
                  // Try smart matching for common patterns
                  if (!matchingOption && value.toLowerCase() === 'yes') {
                    matchingOption = options.find(opt => 
                      /^(yes|true|1|authorized|eligible)$/i.test(opt.value) ||
                      /^(yes|true|authorized|eligible)/i.test(opt.text)
                    );
                  }
                  
                  if (!matchingOption && value.toLowerCase() === 'no') {
                    matchingOption = options.find(opt => 
                      /^(no|false|0|not|decline)$/i.test(opt.value) ||
                      /^(no|false|not|decline)/i.test(opt.text)
                    );
                  }
                  
                  // Try gender matching
                  if (!matchingOption && value.toLowerCase() === 'male') {
                    matchingOption = options.find(opt => 
                      /^(male|m|1)$/i.test(opt.value) || /^male/i.test(opt.text)
                    );
                  }
                  
                  if (!matchingOption && value.toLowerCase() === 'female') {
                    matchingOption = options.find(opt => 
                      /^(female|f|2)$/i.test(opt.value) || /^female/i.test(opt.text)
                    );
                  }
                  
                  if (matchingOption) {
                    element.value = matchingOption.value;
                  } else {
                    // Don't force fill select elements if no matching option found
                    return false;
                  }
                } else {
                  // For regular inputs, set value directly
                  element.value = String(value);
                  
                  // Also set React's internal value for React forms
                  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                  if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(element, String(value));
                  }
                }

                // Trigger comprehensive events for maximum compatibility
                const events = [
                  new Event('input', { bubbles: true, cancelable: true }),
                  new Event('change', { bubbles: true, cancelable: true }),
                  new Event('blur', { bubbles: true, cancelable: true }),
                  new Event('keyup', { bubbles: true, cancelable: true }),
                  new Event('keydown', { bubbles: true, cancelable: true })
                ];

                events.forEach(event => {
                  try {
                    element.dispatchEvent(event);
                  } catch (e) {
                    // Ignore event dispatch errors
                  }
                });

                // Special handling for React synthetic events
                if (element._valueTracker) {
                  element._valueTracker.setValue('');
                }

                // Focus and blur to trigger any validation
                try {
                  element.focus();
                  setTimeout(() => element.blur(), 10);
                } catch (e) {
                  // Ignore focus errors
                }

                addVisualFeedback(element);
                return true;
              } catch (_error) {
                return false;
              }
            }

            let filledCount = 0;

            // ATS-specific strategies
            if (ats === 'greenhouse') {
              const form = document.forms['application_form'] || document.querySelector('form');
              if (form) {
                const fieldMap = {
                  // Standard Greenhouse fields
                  'job_application[first_name]': data.firstName,
                  'job_application[last_name]': data.lastName,
                  'job_application[email]': data.email,
                  'job_application[phone]': data.phone,
                  'email': data.email,
                  'phone': data.phone,
                  'first_name': data.firstName,
                  'last_name': data.lastName,
                  'preferred_name': data.preferredFirstName,
                  'org': data.company,
                  // Custom questions (common patterns)
                  'job_application[answers_attributes][0][text_value]': data.linkedin,
                  'job_application[answers_attributes][1][text_value]': data.portfolio,
                  'job_application[answers_attributes][2][text_value]': data.github,
                  // GitHub fields (multiple question IDs)
                  'question_9262347007': data.github,
                  'question_9262348007': data.linkedin,
                  // URL fields
                  'urls[Github]': data.github,
                  'urls[GitHub]': data.github,
                  'urls[Github ]': data.github,
                  'urls[LinkedIn]': data.linkedin,
                  'urls[Website]': data.portfolio,
                  'comments': data.coverLetter,
                  'job_application[location]': data.location,
                  'job_application[current_company]': data.currentCompany,
                  'current_company': data.currentCompany,
                  'current_location': data.currentLocation,
                  // Work authorization fields from extracted data
                  'question_9763221007': data.workAuthorization === 'Authorized' ? 'Yes' : 'No',
                  'question_9763222007': data.requiresSponsorship ? 'Yes' : 'No'
                };

                Object.entries(fieldMap).forEach(([fieldName, value]) => {
                  if (!value) return;
                  const field = form.elements[fieldName];
                  if (field && fillField(field, value)) {
                    filledCount++;
                  }
                });
              }
            } else if (ats === 'workable') {
              const fieldMap = {
                'candidate_firstname': data.firstName,
                'candidate_lastname': data.lastName,
                'candidate_email': data.email,
                'candidate_phone': data.phone,
                'candidate_company': data.company,
                'candidate_linkedin': data.linkedin,
                'candidate_github': data.github,
                'candidate_website': data.portfolio,
                'candidate_current_company': data.currentCompany,
                'candidate_location': data.currentLocation
              };

              Object.entries(fieldMap).forEach(([fieldName, value]) => {
                if (!value) return;
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (field && fillField(field, value)) {
                  filledCount++;
                }
              });
            } else if (ats === 'lever') {
              const fieldMap = {
                'name': `${data.firstName} ${data.lastName}`,
                'email': data.email,
                'phone': data.phone,
                'org': data.company,
                'urls[LinkedIn]': data.linkedin,
                'urls[GitHub]': data.github,
                'urls[Portfolio]': data.portfolio,
                'comments': data.coverLetter
              };

              Object.entries(fieldMap).forEach(([fieldName, value]) => {
                if (!value) return;
                const field = document.querySelector(`[name="${fieldName}"]`);
                if (field && fillField(field, value)) {
                  filledCount++;
                }
              });
            } else if (ats === 'workday') {
              // Workday uses data-automation-id attributes
              const workdayFields = [
                { selector: '[data-automation-id*="firstName"]', value: data.firstName },
                { selector: '[data-automation-id*="lastName"]', value: data.lastName },
                { selector: '[data-automation-id*="email"]', value: data.email },
                { selector: '[data-automation-id*="phone"]', value: data.phone },
                { selector: '[data-automation-id*="company"]', value: data.company }
              ];

              workdayFields.forEach(({ selector, value }) => {
                if (!value) return;
                const field = document.querySelector(selector);
                if (field && fillField(field, value)) {
                  filledCount++;
                }
              });
            } else if (ats === 'ashby') {
              // Ashby uses _systemfield_ prefix and UUID field names
              const ashbyFields = [
                { selector: '[name="_systemfield_name"], [id="_systemfield_name"]', value: `${data.firstName} ${data.lastName}` },
                { selector: '[name="_systemfield_email"], [id="_systemfield_email"]', value: data.email },
                // Phone field uses UUID, find by label or placeholder
                { selector: 'input[type="tel"], input[placeholder*="phone"], input[placeholder*="415-555"]', value: data.phone },
                // LinkedIn field - find by label containing "linkedin"
                { selector: 'input[type="text"]', value: data.linkedin, labelContains: 'linkedin' },
                // Website field - find by label containing "website"
                { selector: 'input[type="text"]', value: data.portfolio, labelContains: 'website' },
                // Additional text fields can be added here as needed
              ];

              ashbyFields.forEach(({ selector, value, labelContains }) => {
                if (!value) return;
                
                let elements = document.querySelectorAll(selector);
                if (labelContains) {
                  // Filter by label text
                  elements = Array.from(elements).filter(el => {
                    const label = el.labels?.[0]?.textContent?.toLowerCase() || 
                                 document.querySelector(`label[for="${el.id}"]`)?.textContent?.toLowerCase() ||
                                 el.closest('label')?.textContent?.toLowerCase() || '';
                    return label.includes(labelContains);
                  });
                }
                
                elements.forEach(field => {
                  if (fillField(field, value)) {
                    filledCount++;
                  }
                });
              });
            }

            // Generic field detection with enhanced patterns
            const formElements = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');

            formElements.forEach((element, index) => {
              if (element.disabled || element.readOnly) return;
              
              const name = element.name?.toLowerCase() || '';
              const id = element.id?.toLowerCase() || '';
              const placeholder = element.placeholder?.toLowerCase() || '';
              const ariaLabel = element.getAttribute('aria-label')?.toLowerCase() || '';
              const className = element.className?.toLowerCase() || '';
              const dataTestId = element.getAttribute('data-testid')?.toLowerCase() || '';
              const dataAutomationId = element.getAttribute('data-automation-id')?.toLowerCase() || '';
              
              // Find associated label (multiple methods)
              let labelText = '';
              if (element.id) {
                const label = document.querySelector(`label[for="${element.id}"]`);
                if (label) labelText = label.textContent?.toLowerCase() || '';
              }
              
              // Check for parent label
              if (!labelText) {
                const parentLabel = element.closest('label');
                if (parentLabel) labelText = parentLabel.textContent?.toLowerCase() || '';
              }
              
              // Check for sibling label
              if (!labelText && element.previousElementSibling && element.previousElementSibling.tagName === 'LABEL') {
                labelText = element.previousElementSibling.textContent?.toLowerCase() || '';
              }
              
              // Check for nearby text (within parent div)
              if (!labelText) {
                const parent = element.parentElement;
                if (parent) {
                  const text = parent.textContent?.toLowerCase() || '';
                  labelText = text.replace(element.value || '', '').trim();
                }
              }
              
              const combinedText = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText} ${className} ${dataTestId} ${dataAutomationId}`.toLowerCase();

              // Enhanced field matching with more patterns
              const patterns = [
                { 
                  keywords: ['first', 'fname', 'given', 'forename', 'firstname', 'first_name', 'givenname'], 
                  value: data.firstName,
                  field: 'firstName'
                },
                { 
                  keywords: ['last', 'lname', 'surname', 'family', 'lastname', 'last_name', 'familyname'], 
                  value: data.lastName,
                  field: 'lastName'
                },
                { 
                  keywords: ['preferred', 'preferred_name', 'preferredname'], 
                  value: data.preferredFirstName,
                  field: 'preferredFirstName'
                },
                { 
                  keywords: ['full', 'name', 'fullname', 'full_name', 'candidate_name'], 
                  value: `${data.firstName} ${data.lastName}`,
                  field: 'fullName',
                  excludeKeywords: ['first', 'last', 'user', 'company']
                },
                { 
                  keywords: ['email', 'mail', 'e-mail', 'e_mail'], 
                  value: data.email,
                  field: 'email'
                },
                { 
                  keywords: ['phone', 'telephone', 'mobile', 'cell', 'tel', 'phonenumber', 'phone_number'], 
                  value: data.phone,
                  field: 'phone'
                },
                { 
                  keywords: ['company', 'organization', 'org', 'employer'], 
                  value: data.company,
                  field: 'company'
                },
                { 
                  keywords: ['current_company', 'currentcompany', 'current company'], 
                  value: data.currentCompany,
                  field: 'currentCompany'
                },
                { 
                  keywords: ['current_location', 'currentlocation', 'current location'], 
                  value: data.currentLocation,
                  field: 'currentLocation'
                },
                { 
                  keywords: ['linkedin', 'linked_in'], 
                  value: data.linkedin,
                  field: 'linkedin'
                },
                { 
                  keywords: ['github', 'git_hub'], 
                  value: data.github,
                  field: 'github'
                },
                { 
                  keywords: ['portfolio', 'website', 'personal_website', 'personalwebsite', 'site'], 
                  value: data.portfolio,
                  field: 'portfolio',
                  excludeKeywords: ['company']
                },
                { 
                  keywords: ['twitter'], 
                  value: data.twitter,
                  field: 'twitter'
                },
                { 
                  keywords: ['cover', 'letter', 'message', 'comment', 'additional', 'info', 'coverletter'], 
                  value: data.coverLetter,
                  field: 'coverLetter'
                },
                { 
                  keywords: ['street', 'address', 'addr', 'address1', 'address_1'], 
                  value: data.street,
                  field: 'street'
                },
                { 
                  keywords: ['city'], 
                  value: data.city,
                  field: 'city',
                  excludeKeywords: ['hispanic', 'latino', 'ethnicity', 'race', 'veteran', 'disability', 'gender', 'eligible', 'authorized']
                },
                { 
                  keywords: ['state', 'province'], 
                  value: data.state,
                  field: 'state',
                  excludeKeywords: ['hispanic', 'latino', 'ethnicity', 'race', 'veteran', 'disability', 'gender', 'eligible', 'authorized', 'united states']
                },
                { 
                  keywords: ['zip', 'postal', 'postcode', 'zipcode', 'zip_code', 'postal_code'], 
                  value: data.zipCode,
                  field: 'zipCode',
                  excludeKeywords: ['hispanic', 'latino', 'ethnicity', 'race', 'veteran', 'disability', 'gender', 'eligible', 'authorized']
                },
                { 
                  keywords: ['country'], 
                  value: data.country,
                  field: 'country',
                  excludeKeywords: ['hispanic', 'latino', 'ethnicity', 'race', 'veteran', 'disability', 'gender', 'eligible', 'authorized']
                },
                { 
                  keywords: ['location'], 
                  value: data.location,
                  field: 'location',
                  excludeKeywords: ['work', 'job', 'office', 'eligible', 'legal', 'authorize', 'united states', 'visa', 'sponsor']
                },
                // Additional patterns from field extraction
                { 
                  keywords: ['address', 'addr'], 
                  value: data.street || data.location,
                  field: 'address',
                  excludeKeywords: ['hispanic', 'latino', 'ethnicity', 'race', 'veteran', 'disability', 'gender', 'eligible', 'authorized']
                },
                { 
                  keywords: ['postcode', 'zipcode'], 
                  value: data.zipCode,
                  field: 'postcode'
                },
                // Work authorization patterns
                { 
                  keywords: ['eligible', 'authorized', 'legally eligible', 'work authorization', 'visa', 'sponsor'], 
                  value: data.workAuthorization === 'Authorized' ? 'Yes' : 'No',
                  field: 'workEligible',
                  skipIfEmpty: true,
                  excludeKeywords: ['address', 'location', 'city', 'state', 'country']
                }
              ];

              for (const pattern of patterns) {
                if (!pattern.value && pattern.skipIfEmpty) continue;
                if (!pattern.value) continue;
                
                const hasKeyword = pattern.keywords.some(keyword => combinedText.includes(keyword));
                const hasExcluded = pattern.excludeKeywords ? 
                  pattern.excludeKeywords.some(keyword => combinedText.includes(keyword)) : false;
                
                if (hasKeyword && !hasExcluded) {
                  if (fillField(element, pattern.value)) {
                    filledCount++;
                  }
                  break;
                }
              }
            });

            return {
              success: filledCount > 0,
              message: filledCount > 0 
                ? `Successfully filled ${filledCount} fields using ${ats} strategy`
                : 'No compatible fields found on this page',
              filled: filledCount
            };

          } catch (error) {
            console.error('Autofill error:', error);
            return {
              success: false,
              message: `Autofill failed: ${error.message}`,
              filled: 0
            };
          }
        },
        args: [selectedProfile]
      });

      logger.log('Autofill results:', results);

      // Check if the script executed successfully
      if (results && results[0] && results[0].result) {
        const result = results[0].result;
        logger.log('Autofill result details:', result);
        
        if (result.success) {
          if (result.filled > 0) {
            onSuccess(`${result.message} - filled ${result.filled} field${result.filled !== 1 ? 's' : ''} with ${selectedProfile.profileName}!`);
          } else {
            onSuccess(`${result.message}. The form may load dynamically - try again in a moment.`);
          }
        } else {
          onError(result.message || 'Autofill encountered an error. Check the console for details.');
        }
      } else if (results && results[0] && results[0].error) {
        // Script threw an error
        console.error('Script error:', results[0].error);
        onError(`Autofill error: ${results[0].error.message || 'Unknown error'}`);
      } else {
        // No result returned - script may have executed but didn't return properly
        onSuccess('Autofill executed. Check if fields were filled.');
      }
    } catch (err: any) {
      console.error('Autofill error:', err);
      
      // Check for specific error types
      if (err.message?.includes('Cannot access') || err.message?.includes('chrome://') || err.message?.includes('brave://')) {
        onError('Cannot autofill on browser pages. Please navigate to a job application website.');
      } else if (err.message?.includes('permissions')) {
        onError('Permission denied. Check extension permissions in brave://extensions');
      } else if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('brave://') || tab.url.startsWith('chrome-extension://')) {
        onError('This page is protected by the browser. Navigate to a regular website.');
      } else if (tab.url?.endsWith('.pdf')) {
        onError('Cannot autofill PDF files. Open a web form instead.');
      } else {
        onError(`Autofill error: ${err.message || 'Please try refreshing the page'}`);
      }
    } finally {
      setIsAutofilling(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Quick Autofill
            </CardTitle>
            <CardDescription className="text-sm mt-1">
              Fill application forms with your profile data
            </CardDescription>
          </div>
          {selectedProfile && (
            <Badge variant="secondary" className="text-xs">
              Ready
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error State */}
        {error && (
          <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-xs opacity-90">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Selector Dropdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Select Profile</label>
            {profiles.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {profiles.length} profile{profiles.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>
          
          {isLoadingProfiles ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading profiles...</p>
              </div>
            </div>
          ) : profiles.length > 0 ? (
            <Select
              value={selectedProfile?._id || ''}
              onValueChange={handleProfileSelect}
            >
              <SelectTrigger className="w-full h-11 transition-all duration-200 hover:border-primary/50 focus:border-primary">
                <SelectValue placeholder="Choose a profile..." />
              </SelectTrigger>
              <SelectContent className="w-full">
                {profiles.map((profile) => (
                  <SelectItem 
                    key={profile._id} 
                    value={profile._id}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium">{profile.profileName}</span>
                      {profile.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs h-5">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center p-6 bg-muted/30 rounded-lg border border-dashed">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground">No profiles found</p>
              <p className="text-xs text-muted-foreground mb-4">Create a profile to start autofilling</p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadProfiles}
                disabled={isLoadingProfiles}
                className="w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry Loading
              </Button>
            </div>
          )}
        </div>

        {/* Selected Profile Info */}
        {selectedProfile && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-card/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-foreground">Profile Information</span>
                <Badge variant="outline" className="ml-auto text-xs">
                  {selectedProfile.profileName}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {/* Contact Information */}
                <div className="space-y-2">
                  {selectedProfile.contactInfo?.name && (
                    <ContactItem
                      icon={User}
                      label="Name"
                      value={selectedProfile.contactInfo.name}
                      onCopy={() => copyToClipboard(selectedProfile.contactInfo.name, 'Name')}
                      isCopied={copiedText === selectedProfile.contactInfo.name}
                    />
                  )}
                  
                  {selectedProfile.contactInfo?.email && (
                    <ContactItem
                      icon={Mail}
                      label="Email"
                      value={selectedProfile.contactInfo.email}
                      onCopy={() => copyToClipboard(selectedProfile.contactInfo.email, 'Email')}
                      isCopied={copiedText === selectedProfile.contactInfo.email}
                    />
                  )}
                  
                  {selectedProfile.contactInfo?.phone && (
                    <ContactItem
                      icon={Phone}
                      label="Phone"
                      value={selectedProfile.contactInfo.phone}
                      onCopy={() => copyToClipboard(selectedProfile.contactInfo.phone, 'Phone')}
                      isCopied={copiedText === selectedProfile.contactInfo.phone}
                    />
                  )}
                  
                  {selectedProfile.contactInfo?.location && (
                    <ContactItem
                      icon={MapPin}
                      label="Location"
                      value={selectedProfile.contactInfo.location}
                      onCopy={() => copyToClipboard(selectedProfile.contactInfo.location, 'Location')}
                      isCopied={copiedText === selectedProfile.contactInfo.location}
                    />
                  )}
                </div>

                {/* Social Links */}
                {(selectedProfile.contactInfo?.linkedin || 
                  selectedProfile.contactInfo?.github || 
                  selectedProfile.contactInfo?.personalWebsite || 
                  selectedProfile.contactInfo?.twitter) && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Social Links</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.contactInfo?.linkedin && (
                        <SocialButton
                          icon={Linkedin}
                          label="LinkedIn"
                          url={selectedProfile.contactInfo.linkedin}
                          onCopy={() => copyToClipboard(selectedProfile.contactInfo.linkedin || '', 'LinkedIn URL')}
                          isCopied={copiedText === selectedProfile.contactInfo.linkedin}
                        />
                      )}
                      {selectedProfile.contactInfo?.github && (
                        <SocialButton
                          icon={Github}
                          label="GitHub"
                          url={selectedProfile.contactInfo.github}
                          onCopy={() => copyToClipboard(selectedProfile.contactInfo.github || '', 'GitHub URL')}
                          isCopied={copiedText === selectedProfile.contactInfo.github}
                        />
                      )}
                      {selectedProfile.contactInfo?.personalWebsite && (
                        <SocialButton
                          icon={Globe}
                          label="Website"
                          url={selectedProfile.contactInfo.personalWebsite}
                          onCopy={() => copyToClipboard(selectedProfile.contactInfo.personalWebsite || '', 'Website URL')}
                          isCopied={copiedText === selectedProfile.contactInfo.personalWebsite}
                        />
                      )}
                      {selectedProfile.contactInfo?.twitter && (
                        <SocialButton
                          icon={Twitter}
                          label="Twitter"
                          url={selectedProfile.contactInfo.twitter}
                          onCopy={() => copyToClipboard(selectedProfile.contactInfo.twitter || '', 'Twitter URL')}
                          isCopied={copiedText === selectedProfile.contactInfo.twitter}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Autofill Button */}
        <div className="pt-2">
          <Button 
            onClick={handleAutofill}
            disabled={!selectedProfile || isAutofilling}
            variant="default"
            size="lg"
            className={cn(
              "w-full h-11 font-medium transition-all duration-200",
              "bg-primary hover:bg-primary/90 text-primary-foreground",
              "shadow-sm hover:shadow-md",
              !selectedProfile && "opacity-50 cursor-not-allowed",
              isAutofilling && "opacity-75"
            )}
          >
            {isAutofilling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Autofilling...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Autofill Form
              </>
            )}
          </Button>
          
          {!selectedProfile && profiles.length > 0 && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Select a profile to enable autofill
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Helper Components
interface ContactItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  onCopy: () => void;
  isCopied: boolean;
}

function ContactItem({ icon: Icon, label, value, onCopy, isCopied }: ContactItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center gap-3 p-2 rounded-md transition-all duration-200",
        "cursor-pointer hover:bg-muted/50 active:bg-muted/70",
        "group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      )}
      onClick={onCopy}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCopy();
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Copy ${label}: ${value}`}
    >
      <Icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {value}
          </span>
          {isCopied ? (
            <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

interface SocialButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  url: string;
  onCopy: () => void;
  isCopied: boolean;
}

function SocialButton({ icon: Icon, label, url, onCopy, isCopied }: SocialButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      className={cn(
        "h-8 px-3 transition-all duration-200",
        "hover:bg-muted hover:border-primary/50",
        isCopied && "bg-green-50 border-green-200 text-green-700"
      )}
      onClick={onCopy}
      title={`Copy ${label} URL`}
      aria-label={`Copy ${label} URL: ${url}`}
    >
      {isCopied ? (
        <Check className="h-3 w-3 mr-1" />
      ) : (
        <Icon className="h-3 w-3 mr-1" />
      )}
      <span className="text-xs font-medium">{label}</span>
    </Button>
  );
}