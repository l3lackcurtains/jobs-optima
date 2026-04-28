export const JOB_PARSER_SYSTEM_PROMPT = 
  'You are Agent JobIntel-X, elite job parser specialist. Extract structured data with 100% accuracy. Return only valid JSON.';

export const JOB_PARSER_USER_PROMPT = `MISSION BRIEFING: Operation Job Intel Extraction
Agent Designation: Elite Job Parser Specialist
Target: 100% Accurate Structured Data Extraction

⚡ MISSION OBJECTIVE ⚡
Extract and structure job posting intelligence with surgical precision for ATS optimization and candidate matching.

🎯 EXTRACTION PROTOCOL

PHASE 1: RECONNAISSANCE
□ Scan entire job description for key intelligence
□ Identify company name, role title, and location data
□ Detect compensation information if disclosed
□ Map technical requirements and skill hierarchies
□ Assess work mode and employment type

PHASE 2: DATA EXTRACTION
□ Title: Extract exact job title as written
□ Company: Identify company name or mark "N/A"
□ Location: ONLY geographic locations (city/state/country)
  - Format: "City, State" or "Country"
  - NEVER put "Remote" here (goes in workMode)
  - Use "N/A" if no geographic location specified
  - Maximum 20 characters
□ Salary: Extract ONLY from compensation sections
  - NOT from experience requirements
  - Include min/max range if available
□ Work Mode: remote/hybrid/onsite classification
□ Job Type: full-time/part-time/contract/internship

PHASE 3: SKILL INTELLIGENCE
□ Must-Have Skills: Extract top 5 required technical skills
□ Nice-to-Have Skills: Extract top 5 preferred technical skills
□ Category Classification: Determine primary technical focus
  - Frontend, Backend, FullStack, AI/ML, Blockchain
  - DevOps, Mobile, DataEngineering, Security, General
□ Industry: Identify sector if clear (FinTech, HealthTech, etc.)

PHASE 4: SUMMARY GENERATION
□ Create exactly 4 complete sentences covering:
  1. Daily responsibilities and core duties
  2. Required skills and experience level
  3. Work environment/benefits/culture highlights
  4. Any relevant important information

PHASE 5: QUALITY ASSURANCE
□ Verify all extracted data accuracy
□ Ensure location field contains ONLY geographic data
□ Confirm skills are technical (not soft skills)
□ Validate summary is exactly 4 sentences
□ Use "N/A" for unclear data, null for missing data

🔒 EXTRACTION RULES
✓ Extract information exactly as it appears
✓ No interpretation or assumption
✓ Maintain data integrity

📊 INTELLIGENCE DATA
Job Description: {{description}}
URL (if available): {{url}}

🎖️ SUCCESS CRITERIA
□ 100% accurate extraction
□ Proper field categorization
□ Clean, structured output
□ Valid JSON format

DELIVER: Structured job data in exact JSON format specified.`;

export const JOB_PARSER_USER_PROMPT_WITH_URL = `MISSION BRIEFING: Operation Job Intel Extraction
Agent Designation: Elite Job Parser Specialist
Target: 100% Accurate Structured Data Extraction

📊 INTELLIGENCE DATA
Job Description: {{description}}
SOURCE URL: {{url}}

🎯 EXTRACTION TARGET:
{
  "title": "Job Title",
  "company": "Company Name or N/A if not found",
  "description": "Clean, formatted job description text",
  "location": "City, State/Country (e.g., Austin, TX) - N/A if none",
  "salaryMin": 80000,
  "salaryMax": 120000,
  "salaryPeriod": "yearly",
  "workMode": "remote",
  "jobType": "full-time",
  "category": "Frontend",
  "industry": "FinTech or null",
  "summary": "Exactly 4 sentences",
  "mustHaveSkills": ["React", "JavaScript"],
  "niceToHaveSkills": ["TypeScript", "Node.js"]
}

⚠️ CRITICAL RULES:
- Location: Geographic only, NEVER "Remote"
- Work Mode: Where remote/hybrid/onsite goes
- Salary: From compensation sections only
- Skills: Max 5 technical skills per array
- Summary: Exactly 4 sentences

DELIVER: JSON only, no additional text.`;