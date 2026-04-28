// Advanced autofill engine based on multiple proven approaches
export interface AutofillProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  coverLetter?: string;
  // Address fields
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  location?: string; // Combined location field
  // Additional fields
  twitter?: string;
  personalWebsite?: string;
  currentSalary?: string;
  desiredSalary?: string;
  workAuthorization?: string;
  availableStartDate?: string;
  // EEO fields
  gender?: 'Male' | 'Female' | 'Prefer not to say';
  ethnicity?: string;
  race?: string;
  veteran?: 'Yes' | 'No' | 'Prefer not to say';
  disability?: 'Yes' | 'No' | 'Prefer not to say';
}

// String matching utilities
const stringMatch = {
  exact: (str1: string, str2: string, caseSensitive = false): boolean => {
    if (!caseSensitive) {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
    }
    return str1 === str2;
  },
  
  contains: (str1: string, str2: string, caseSensitive = false): boolean => {
    if (!caseSensitive) {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
    }
    return str1.includes(str2);
  },
  
  keywordMatch: (str: string, keywords: string[], caseSensitive = false): boolean => {
    if (!caseSensitive) {
      str = str.toLowerCase();
      keywords = keywords.map(k => k.toLowerCase());
    }
    return keywords.some(keyword => str.includes(keyword));
  }
};

// ATS Provider detection
function detectATS(): string {
  const url = window.location.href.toLowerCase();
  const hostname = window.location.hostname.toLowerCase();
  
  if (hostname.includes('greenhouse') || url.includes('greenhouse')) return 'greenhouse';
  if (hostname.includes('workable') || url.includes('workable')) return 'workable';
  if (hostname.includes('lever') || url.includes('lever')) return 'lever';
  if (hostname.includes('workday') || url.includes('workday')) return 'workday';
  if (hostname.includes('bamboohr') || url.includes('bamboo')) return 'bamboohr';
  if (hostname.includes('smartrecruiters')) return 'smartrecruiters';
  if (hostname.includes('jobvite')) return 'jobvite';
  if (hostname.includes('icims')) return 'icims';
  
  return 'generic';
}

// Visual feedback for filled fields
function addVisualFeedback(element: HTMLElement): void {
  element.style.border = '2px solid #10b981';
  element.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
  
  // Remove feedback when user interacts with field
  const removeHighlight = () => {
    element.style.border = '';
    element.style.backgroundColor = '';
    element.removeEventListener('input', removeHighlight);
    element.removeEventListener('change', removeHighlight);
  };
  
  element.addEventListener('input', removeHighlight, { once: true });
  element.addEventListener('change', removeHighlight, { once: true });
}

// Enhanced event simulation
function simulateUserInput(element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value: string | boolean): boolean {
  try {
    // Handle different input types
    if (element instanceof HTMLInputElement) {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = Boolean(value);
      } else {
        element.value = String(value);
      }
    } else if (element instanceof HTMLSelectElement) {
      element.value = String(value);
    } else if (element instanceof HTMLTextAreaElement) {
      element.value = String(value);
    }

    // Trigger multiple events to ensure compatibility
    const events = ['input', 'change', 'blur'];
    events.forEach(eventType => {
      const event = new Event(eventType, { bubbles: true });
      element.dispatchEvent(event);
    });

    // Also trigger React synthetic events if detected
    const reactKey = Object.keys(element).find(key => key.startsWith('__reactInternalInstance'));
    if (reactKey) {
      const syntheticEvent = new Event('input', { bubbles: true });
      Object.defineProperty(syntheticEvent, 'target', { value: element });
      element.dispatchEvent(syntheticEvent);
    }

    addVisualFeedback(element);
    return true;
  } catch (error) {
    console.warn('Failed to fill field:', error);
    return false;
  }
}

// Field detection strategies by ATS
const atsStrategies = {
  greenhouse: (profile: AutofillProfile) => {
    const fields = new Map<string, string>();
    
    // Greenhouse specific field patterns
    fields.set('job_application[first_name]', profile.firstName);
    fields.set('job_application[last_name]', profile.lastName);
    fields.set('email', profile.email);
    fields.set('phone', profile.phone);
    fields.set('org', profile.company || '');
    
    // Custom questions (common patterns)
    fields.set('job_application[answers_attributes][0][text_value]', profile.linkedin || '');
    fields.set('job_application[answers_attributes][1][text_value]', profile.portfolio || '');
    fields.set('urls[Github]', profile.github || '');
    fields.set('urls[GitHub]', profile.github || '');
    fields.set('urls[Github ]', profile.github || ''); // With space
    fields.set('urls[Twitter]', '');
    fields.set('comments', profile.coverLetter || '');
    
    // EEO fields
    if (profile.gender) {
      const genderValue = profile.gender === 'Male' ? '1' : profile.gender === 'Female' ? '2' : '3';
      fields.set('job_application[gender]', genderValue);
    }
    
    if (profile.veteran) {
      const veteranValue = profile.veteran === 'Yes' ? '1' : profile.veteran === 'No' ? '2' : '3';
      fields.set('job_application[veteran_status]', veteranValue);
    }
    
    if (profile.disability) {
      const disabilityValue = profile.disability === 'Yes' ? '1' : profile.disability === 'No' ? '2' : '3';
      fields.set('job_application[disability_status]', disabilityValue);
    }
    
    return fields;
  },
  
  workable: (profile: AutofillProfile) => {
    const fields = new Map<string, string>();
    
    // Workable patterns
    fields.set('candidate_firstname', profile.firstName);
    fields.set('candidate_lastname', profile.lastName);
    fields.set('candidate_email', profile.email);
    fields.set('candidate_phone', profile.phone);
    fields.set('candidate_company', profile.company || '');
    
    return fields;
  },
  
  lever: (profile: AutofillProfile) => {
    const fields = new Map<string, string>();
    
    // Lever patterns
    fields.set('name', `${profile.firstName} ${profile.lastName}`);
    fields.set('email', profile.email);
    fields.set('phone', profile.phone);
    fields.set('org', profile.company || '');
    
    return fields;
  },
  
  workday: (profile: AutofillProfile) => {
    const fields = new Map<string, string>();
    
    // Workday patterns (more complex, often uses data-automation-id)
    return fields;
  },
  
  generic: (_profile: AutofillProfile) => {
    const fields = new Map<string, string>();
    // We'll use smart detection for generic cases
    return fields;
  }
};

// Smart field detection for generic forms
function detectFormFields(profile: AutofillProfile): Map<HTMLElement, string> {
  const fieldsToFill = new Map<HTMLElement, string>();
  
  // Get all form elements
  const formElements = document.querySelectorAll('input, select, textarea');
  
  formElements.forEach(element => {
    const el = element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    
    // Skip hidden, disabled, or readonly fields
    if (el.type === 'hidden' || el.disabled || ('readOnly' in el && el.readOnly)) return;
    
    // Get field identifiers
    const name = el.name?.toLowerCase() || '';
    const id = el.id?.toLowerCase() || '';
    const placeholder = ('placeholder' in el ? el.placeholder?.toLowerCase() : '') || '';
    const ariaLabel = el.getAttribute('aria-label')?.toLowerCase() || '';
    
    // Find associated label
    let labelText = '';
    if (el.id) {
      const label = document.querySelector(`label[for="${el.id}"]`);
      if (label) labelText = label.textContent?.toLowerCase() || '';
    }
    
    // Combine all text for matching
    const combinedText = `${name} ${id} ${placeholder} ${ariaLabel} ${labelText}`.toLowerCase();
    
    // Match against field patterns
    if (stringMatch.keywordMatch(combinedText, ['first', 'fname', 'given', 'forename'])) {
      fieldsToFill.set(el, profile.firstName);
    } else if (stringMatch.keywordMatch(combinedText, ['last', 'lname', 'surname', 'family'])) {
      fieldsToFill.set(el, profile.lastName);
    } else if (stringMatch.keywordMatch(combinedText, ['email', 'mail'])) {
      fieldsToFill.set(el, profile.email);
    } else if (stringMatch.keywordMatch(combinedText, ['phone', 'telephone', 'mobile', 'cell'])) {
      fieldsToFill.set(el, profile.phone);
    } else if (stringMatch.keywordMatch(combinedText, ['company', 'organization', 'org', 'employer', 'current_company'])) {
      fieldsToFill.set(el, profile.company || '');
    } else if (stringMatch.keywordMatch(combinedText, ['linkedin'])) {
      fieldsToFill.set(el, profile.linkedin || '');
    } else if (stringMatch.keywordMatch(combinedText, ['github'])) {
      fieldsToFill.set(el, profile.github || '');
    } else if (stringMatch.keywordMatch(combinedText, ['portfolio', 'website', 'personal_website'])) {
      fieldsToFill.set(el, profile.portfolio || '');
    } else if (stringMatch.keywordMatch(combinedText, ['twitter'])) {
      fieldsToFill.set(el, profile.twitter || '');
    } else if (stringMatch.keywordMatch(combinedText, ['cover', 'letter', 'message', 'comment', 'additional', 'info'])) {
      fieldsToFill.set(el, profile.coverLetter || '');
    } else if (stringMatch.keywordMatch(combinedText, ['street', 'address', 'addr'])) {
      fieldsToFill.set(el, profile.street || '');
    } else if (stringMatch.keywordMatch(combinedText, ['city'])) {
      fieldsToFill.set(el, profile.city || '');
    } else if (stringMatch.keywordMatch(combinedText, ['state', 'province'])) {
      fieldsToFill.set(el, profile.state || '');
    } else if (stringMatch.keywordMatch(combinedText, ['zip', 'postal', 'postcode'])) {
      fieldsToFill.set(el, profile.zipCode || '');
    } else if (stringMatch.keywordMatch(combinedText, ['country'])) {
      fieldsToFill.set(el, profile.country || '');
    } else if (stringMatch.keywordMatch(combinedText, ['location']) && !stringMatch.keywordMatch(combinedText, ['work', 'job'])) {
      fieldsToFill.set(el, profile.location || '');
    } else if (stringMatch.keywordMatch(combinedText, ['salary', 'compensation', 'expected_salary', 'desired_salary'])) {
      fieldsToFill.set(el, profile.desiredSalary || '');
    } else if (stringMatch.keywordMatch(combinedText, ['current_salary'])) {
      fieldsToFill.set(el, profile.currentSalary || '');
    } else if (stringMatch.keywordMatch(combinedText, ['authorization', 'work_auth', 'visa', 'eligible'])) {
      fieldsToFill.set(el, profile.workAuthorization || '');
    } else if (stringMatch.keywordMatch(combinedText, ['start', 'available', 'date'])) {
      fieldsToFill.set(el, profile.availableStartDate || '');
    }
  });
  
  return fieldsToFill;
}

// Main autofill function
export async function autofillForm(profile: AutofillProfile): Promise<{ success: boolean; message: string; filled: number }> {
  try {
    const ats = detectATS();
    console.log(`Detected ATS: ${ats}`);
    
    let filledCount = 0;
    
    if (ats !== 'generic' && ats in atsStrategies) {
      // Use ATS-specific strategy
      const strategy = atsStrategies[ats as keyof typeof atsStrategies];
      const fieldMap = strategy(profile);
      
      // Find form (Greenhouse uses 'application_form')
      const form = document.forms['application_form'] || document.querySelector('form');
      if (!form) {
        throw new Error('No form found on page');
      }
      
      // Fill fields using exact names
      fieldMap.forEach((value, fieldName) => {
        if (!value) return;
        
        const field = (form.elements as any)[fieldName] as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        if (field && simulateUserInput(field, value)) {
          filledCount++;
        }
      });
    }
    
    // Always try generic detection as fallback or supplement
    const genericFields = detectFormFields(profile);
    genericFields.forEach((value, element) => {
      if (value && simulateUserInput(element as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, value)) {
        filledCount++;
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
      message: `Autofill failed: ${error}`,
      filled: 0
    };
  }
}

// Wait for page to be fully loaded before attempting autofill
export function waitForPageReady(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', () => resolve());
    }
  });
}