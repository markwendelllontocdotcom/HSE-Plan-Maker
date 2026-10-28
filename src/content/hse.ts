/**
 * Standard text of the Oxypro Project Health, Safety & Environment Plan, from the company sample
 * "Project HSE Plan - Sample.pdf" (Rev 00, 26.06.2024). The sample's structure, numbering and wording are
 * kept; spelling slips and the numbering errors of the sample are corrected (see CORRECTIONS below).
 *
 * Tokens: {{CO}} company short name (Oxypro), {{COMPANY}} full company name, {{PROJECT}} project name,
 * {{ORGREF}} Appendix 1 reference, {{ISOCERT}} the ISO 45001 sentence (Appendix 2), {{T02}} permit notice hours.
 */

export type Item = string | { t: string; sub?: string[] };
export type Body =
  | string                                   // paragraph
  | { sub: string; u?: boolean }             // bold line (sub-heading inside a section)
  | { ul: Item[]; deep?: boolean }           // bullet list (deep = indented further, as in the sample)
  | { ol: string[]; deep?: boolean }         // numbered list
  | { slot: string };                        // built from the project data

export interface Sec {
  id: string;
  level: 1 | 2;
  title: string;          // heading in the body
  toc?: string;           // wording in the table of contents, when different
  parent?: string;
  dubai: string;          // Dubai Code of Construction Safety Practice 2008 chapter (sample TOC column)
  added?: boolean;        // not in the sample
  body: Body[];
}

export const SECTIONS: Sec[] = [
  {
    id: 's1', level: 1, title: 'Introduction & Management Commitment', dubai: 'N/A',
    body: [
      '{{CO}} are fully committed to establishing and implementing a proactive HSE Management System in order to ensure that HSE excellence is maintained throughout the project. Every effort will be given to ensure these HSE requirements meet or exceed the project HSE requirements.',
      'This HSE Plan is designed and structured to ensure a consistent and effective approach to HSE is applied for all construction activities related to MEP. All employees of {{CO}}, including sub-contractor personnel are empowered to work safely and enhance HSE performance at every opportunity.',
      '{{CO}} shall ensure in addition, that all aspects of the Main Contractor HSE plan are followed at project site.',
    ],
  },
  {
    id: 's2', level: 1, title: 'Scope & Purpose', dubai: 'N/A',
    body: [
      'The scope of this HSE Plan covers all works associated within the {{PROJECT}} project as per the contract documents.',
      'The purpose of this HSE Plan is to set guidelines for all functions and activities related to MEP construction works in order to ensure that works are carried out safely, thus minimizing injury and health problems at the worksite and reducing adverse impact on environment. All works will be carried out as per {{CO}} HSE Management System, Main Contractor HSE directives & Project Construction HSE Plan and local legislation as stated below:',
      { slot: 'legislation' },
    ],
  },
  {
    id: 's3', level: 1, title: 'Scope of MEP Works', dubai: 'N/A',
    body: [{ slot: 'mep-scope' }],
  },
  {
    id: 's4', level: 1, title: 'Terms & Definitions', dubai: 'N/A',
    body: [
      'The terminologies used in this document and their meanings are given below:',
      { slot: 'terms' },
    ],
  },
  { id: 's5', level: 1, title: 'HSE Management Systems & Commitments', dubai: 'N/A', body: ['{{ISOCERT}}'] },
  {
    id: 's5.1', level: 2, parent: 's5', title: 'Leadership & Commitment', dubai: 'N/A',
    body: [
      'Responsibility for the implementation of the HSE Management System within the project rests with {{CO}} Project Director who will provide all necessary resources essential to the implementation and improvement of the HSEMS on the project.',
      'The Project HSE Manager is the designated {{CO}} representative for overall coordination of the HSEMS at project site. His responsibilities shall include but not be limited to the following:',
      { ul: [
        'Ensuring the HSEMS requirements are established, implemented and maintained at project site.',
        'Reporting of HSEMS Performance to Project Manager and Corporate HSE Manager.',
      ] },
      'The {{CO}} Corporate HSE Manager shall ensure HSE Management system roles and responsibilities are clearly defined and communicated to all concerned.',
      'The responsibility, authority, and interrelationship of every person who manages, performs, and verifies work affecting health, safety and the environment are defined in roles and responsibilities detailed in {{SECREF:s7.2}}.',
      'The {{CO}} HSE Department will conduct periodic HSEMS reviews in order to determine if the system remains adequate and effective. The fundamental goal of Management Reviews is to ensure continual improvement in the HSE Management system.',
      'Management reviews shall address the possible need for changes to policy, objectives and other elements of the HSEMS in light of audit results, as well as changes in legislation, relevant requirements or operational processes.',
      'All reviews shall be documented in minutes of meetings. Actions required shall be documented in action plans and communicated to all concerned for implementation.',
    ],
  },
  {
    id: 's5.2', level: 2, parent: 's5', title: 'Safe Work Procedures (SWP) & Project Risk Registers', dubai: 'N/A',
    body: [
      '{{CO}} HSE shall be controlled and executed in accordance with {{CO}} Safe Work Procedures (SWPs) and Health, Safety & Environmental Standards (HSES). All {{CO}} SWPs and HSES are held within the Project HSE Department. In addition to the SWP and HSES, the {{CO}} HSE Department has prepared a Project Risk Register and an Environmental Impact Register. Both these registers reflect the potential risks which {{CO}} employees are exposed to within the workplace, and what controls will be adopted to minimize and eradicate the risk. The Project HSE Manager will update the risk registers to include any new risks as the project develops.',
      'The following Safe Work Procedures (SWP) are applicable for the project:',
      { slot: 'swp' },
    ],
  },
  {
    id: 's5.3', level: 2, parent: 's5', title: 'HSE Standards (HSES)', dubai: 'N/A',
    body: [
      '{{CO}} have developed a suite of HSE Standards which will be implemented within the {{PROJECT}} project. HSE Standards have been prepared to control onsite work activities undertaken by {{CO}} employees and sub-contractors. The following HSE standards are applicable for the project:',
      { slot: 'hses' },
    ],
  },
  {
    id: 's6', level: 1, title: 'HSE Policy Statements', toc: 'HSE Policy', dubai: 'Chapter 2',
    body: [{ slot: 'policies' }],
  },
  { id: 's7', level: 1, title: 'HSE Organization, Responsibility & Authority', dubai: 'Chapter 1', body: [] },
  {
    id: 's7.1', level: 2, parent: 's7', title: 'HSE Organization', dubai: 'Chapter 1',
    body: [
      'The project organization chart for the {{PROJECT}} project {{ORGREF}}. {{CO}} Project HSE team members will directly report to the Project Manager / Project Director at project site and functionally to the Corporate HSE Manager. Qualified and competent Senior HSE Officers, HSE Officers and Safety Inspectors shall be deployed at the project site based on the labor strength at site and project requirements.',
    ],
  },
  {
    id: 's7.2', level: 2, parent: 's7', title: 'Roles & Responsibilities', dubai: 'Chapter 2',
    body: [
      { sub: 'Project Director / Manager', u: true },
      'The Project Director / Manager is responsible for the overall HSE Management of the contract undertaken by him. They are responsible for:',
      { ul: [
        'Ensuring knowledge of and compliance with company policies, procedures, {{CO}} HSE standards (HSES) and site safety rules.',
        'The Project Director / Manager must be visible in the HSE process, constantly monitoring the project environment and performance. Provide the force and resources necessary for project compliance with agreed HSES.',
        'Taking action to correct discrepancies reported as a result of surveys or inspections.',
        'Ensuring that all employees (including subcontractors) are competent to perform their work tasks.',
        'Ensuring that all personnel have access to and use approved work procedures, are properly trained and know how to use issued equipment safely.',
        'Ensuring that relevant HSE training is provided.',
        'Providing safe plant, equipment and working conditions for all employees.',
        'Ensuring that resources allotted for HSE activities are being properly utilized.',
        'Monitoring compliance with agreed safety procedures and standards.',
        'Ensuring Quarterly HSE Reviews are held for the project.',
        'Ensuring that recommendations arising from incident reviews are implemented by the agreed target date.',
        'Reporting, investigating and following-up HSE incidents in support of the HSE team.',
        'Providing competent supervision and implementing solutions if the work is stopped due to HSE concerns.',
        'Setting a personal example.',
      ] },
      { sub: 'Construction Managers', u: true },
      { ul: [
        'Ensuring knowledge of and compliance with company policies, procedures, {{CO}} HSE Standards and site safety rules.',
        'Construction Managers must be visible in the Health and Safety process, constantly monitoring the project environment and performance. Provide the force and resources necessary for project compliance with agreed safety procedures and standards.',
        'Carrying out inspections as often as necessary to ensure that all work is carried out in accordance with prescribed HSE requirements.',
        'Taking action to correct discrepancies reported as a result of surveys or inspections.',
        'Ensuring that all personnel have access to and use approved work procedures, are properly trained and know how to use issued equipment safely.',
        'Reporting, investigating and following-up HSE incidents in support of the HSE team.',
        'Providing competent supervision and implementing solutions if the work is stopped due to HSE concerns.',
        'Setting a personal example.',
      ] },
      { sub: 'Project HSE Manager', u: true },
      'The Project HSE Manager primary functions are to:',
      { ul: [
        'Ensure knowledge of and compliance with company policies, procedures, {{CO}} HSE standards and site safety rules.',
        'Ensure all staff is aware of their duties and responsibilities.',
        'Manage the day-to-day Project site safety requirements.',
        'Develop, implement and enforce safe systems of work and environmental procedures.',
        'Investigating all fatal and major accidents, injuries, fires and property damage and issuing or circulating required reports and ensuring that recommended corrective and preventive measures are implemented.',
        'Direct the focus and activities of the company site HSE team.',
        'Assist project management with the preparation of Project specific HSE plans, procedures and method statements / risk assessments.',
        'Conducting and participating in project safety meetings where required.',
        'Initiate and organize HSE audits and inspections for the project as required.',
        'Developing and implementing safety-training programs for employees.',
        'Setting a personal example.',
      ] },
      { sub: 'Project Senior HSE Officer', u: true },
      'The Senior HSE Officer reports to the Project HSE Manager and is responsible for:',
      { ul: [
        'Ensuring knowledge of and compliance with company policies, procedures, {{CO}} HSE standards and site safety rules.',
        'Preparing and submitting HSE Reports, HSE Method Statements, Risk Assessments, COSHH Assessments and Lifting Plans.',
        'Conducting regular site inspections and participating periodically in more detailed H&S Audits.',
        'Advise on and assist in the implementation of corrective action or measures necessary to ensure site safety.',
        'Forcefully executing his function without tolerance for noted complacency or non-compliance on the project. Ensuring that habitual violators or safety complacent site personnel are reported to senior management.',
        'Participating in project HSE meetings.',
        'Coordinating and conducting HSE training in accordance with the project requirements.',
        'Investigating, in conjunction with the Project HSE Manager, all accidents, injuries, fires, property damage, near misses and other HSE related incidents, issuing or circulating required reports and ensuring that recommended corrective and preventive measures are implemented.',
        'Evaluating the need for and requesting specified safety equipment.',
        'Setting a personal example.',
      ] },
      { sub: 'Project HSE Officers', u: true },
      'The HSE Officer reports to the Senior HSE Officer and is responsible for:',
      { ul: [
        'Ensuring knowledge of and compliance with company policies, procedures, {{CO}} HSE standards and site safety rules.',
        'Conducting regular site inspections and participating periodically in more detailed H&S Audits.',
        'Advise on and assist in the implementation of corrective action or measures necessary to ensure site safety.',
        'Forcefully executing his function without tolerance for noted complacency or non-compliance on the project. Ensuring that habitual violators or safety complacent site personnel are reported to senior management.',
        'Participating in project safety meetings.',
        'Coordinating site first aid and rescue procedures.',
        'Coordinating and conducting safety training in accordance with the project requirements.',
        'Investigating, in conjunction with the HSE Manager, all accidents, injuries, fires, property damage, near misses and other HSE related incidents, issuing or circulating required reports and ensuring that recommended corrective and preventive measures are implemented.',
        'Evaluating the need for and requesting specified safety equipment.',
        'Setting a personal example.',
      ] },
      { sub: 'Engineers & Supervisors at all Levels (Superintendent / Supervisor / Foreman / Charge Hand)', u: true },
      { ul: [
        'Ensuring knowledge of and compliance with company policies, procedures, {{CO}} HSE Safety standards and site safety rules.',
        'Engineers & Supervisors must be knowledgeable in regard to all aspects of Health, Safety and Environmental practices on their projects. They must be aware of the nature of work that has unusually high incidents or accidents. Supervisors should know what aspects of the work require special HSE precautions. They are responsible for:',
        'Understanding their personal duties and responsibilities.',
        'Supporting the project Health, Safety and Environmental process.',
        'Preventing HSE being circumvented or undermined.',
        'Instructing personnel in HSE requirements and practices applicable to the work that they will be performing through instruction and on-site guidance. This should be daily and before the start of any new task.',
        'Ensuring that all the required safety equipment is requested and made available to those carrying out the work on site.',
        'Reviewing HSE considerations for all job tasks and recognizing potential risks before starting.',
        'Ensuring that Risk / impact assessments are carried out by the relevant engineers / supervisors prior to the execution of specific tasks.',
        'Ensuring that method statements incorporating risk / impact assessments are in place prior to the execution of specific tasks.',
        'Setting a personal example.',
      ] },
      { sub: 'All Personnel / Technicians / Labour', u: true },
      { ul: [
        'Ensuring knowledge of and compliance with {{CO}} HSE safety standards and site safety rules.',
        'They must be aware of the nature of work that has unusually high incidents or accidents.',
        'They are responsible for:',
        'Understanding their personal duties and responsibilities.',
        'Supporting the project Health, Safety and Environmental process.',
        'Preventing HSE being circumvented or undermined.',
        'Ensuring that all required safety equipment is requested, used accordingly and protected from damage or loss.',
        'Discussing any areas of concern with the relevant HSE personnel.',
        'Setting a personal example.',
      ] },
      '{{CO}} Management will ensure all employees are competent to carry out their assigned tasks and holds all employees accountable for successful and safe completion of the specific task. All managers, staff and employees are accountable to meet the company HSE objectives and targets.',
      '{{CO}} Management is responsible for creating a safe working environment for all employees within the company. In order to affect HSE excellence within their projects, the company shall ensure the stated HSE policy and procedures are strictly adhered to and each project will be subject to regular senior management inspections and audits.',
    ],
  },
  { id: 's8', level: 1, title: 'Project HSE & Welfare Control', dubai: 'Chapter 3', body: [] },
  {
    id: 's8.1', level: 2, parent: 's8', title: 'HSE Induction', dubai: 'Chapter 3',
    body: [
      'On arrival at project site, all {{CO}} Employees and sub-contractors will report to the site office where they will attend induction. Prior to commencement of working or entering the Project site; operatives, visitors and subcontractors will also be required to attend the Managing Contractor’s site induction.',
      'All plant and equipment (owned or hired) must report to the HSE Department prior to entering the site. Documentation pertaining to the suitability of the plant / equipment will be verified.',
      'Staff, Operative and visitor induction to the Project will be carried out by the {{CO}} Project HSE Officer. Induction will cover, but is not limited to:',
      { ul: [
        'MEP installation details – type of equipment, site layout, locations etc.',
        'Project Information – Client, Consultant, Managing Contractor role, other trades, vehicle & Pedestrian routes, general site rules etc.',
        '{{CO}} HSE Standards',
        'Security arrangements',
        'Fire & Emergency procedures',
        'Heat Stress Arrangements',
        'First Aid arrangements',
        'Accident & Incident reporting procedures',
        'Welfare and Accommodation Facilities',
        'Housekeeping & Environmental considerations',
        'Toolbox Talk arrangements',
        'Risk / impact assessments and register / Method Statements',
        'Environmental Management',
        'PPE requirements',
        'Company Disciplinary procedures',
      ] },
    ],
  },
  {
    id: 's8.2', level: 2, parent: 's8', title: 'Security', dubai: 'Chapter 2',
    body: [
      'Main security measures for the project are responsibility of the Main Contractor. {{CO}} shall ensure the following security measures are in place for the {{CO}} Offices and Stores areas:',
      { sub: 'Access Arrangements:' },
      { ul: [
        'Vehicles: Access for vehicles to the site will be via recognized site roads only.',
        'Pedestrian: Access to the project site will be via safe walkways and marked pedestrian routes. Personnel will not cross clearly indicated exclusion zones.',
      ] },
      { sub: 'Visitors to Report to:' },
      { ul: [
        'All visitors will report to the project site offices prior to visiting site.',
        'Only inducted personnel will access site.',
      ] },
      { sub: 'Additional Security Measures:' },
      { ul: [
        'Visitors to the project site offices will sign in at reception.',
        'All personnel will ensure that personal and company possessions are secured and or locked away. Items of value will not be left unattended.',
      ] },
    ],
  },
  {
    id: 's8.3', level: 2, parent: 's8', title: 'Project HSE Records', dubai: 'Chapter 2',
    body: [
      'The Project will maintain Site Health, Safety and Environmental Records. Records shall be submitted to the Main Contractor as per the Main Contractor HSE Plan. Site Health, Safety and Environmental Records will include:',
      { ol: [
        'HSE Policy Statements', 'Project HSE Plan', 'HSE Induction', 'Risk Assessment & Method Statements', 'Environmental Control',
        'Incident Reports', 'Safety in Offices', 'HSE Audit & Inspection', 'HSE Communication', 'Emergency Management', 'HSE Performance',
        'PPE', 'Legal Requirements & Compliance', 'HSE Training', 'Toolbox Talks', 'HSE Inspections', 'Permit to Work', 'HSE Forms', 'HSE General',
      ], deep: true },
    ],
  },
  {
    id: 's8.4', level: 2, parent: 's8', title: 'Competence & Training', dubai: 'Chapter 2',
    body: [
      'All employees will be competent to carry out their duties. {{CO}} Project Managers will ensure that operatives are adequately trade tested to determine capability and are trained and / or experienced in carrying out the tasks allocated to them. Safety and specialist training will be provided in-house or via external trainers as necessary to ensure that any specific project requirements are met.',
      'It will be the responsibility of the Project HSE Engineer in conjunction with the Construction Manager to ensure that all site operatives engaged in certain operations hold valid certification.',
      'Employees carrying out the following activities MUST hold recognized certificates of competence:',
      { slot: 'competence' },
      '{{CO}} hold internal training programmes for all levels e.g. ESSW, Work at Height, Fire Safety & Safety for Supervisors. Training requirements can be found in the {{CO}} training Matrix.',
    ],
  },
  {
    id: 's8.5', level: 2, parent: 's8', title: 'Toolbox Talks / Daily Work Instruction', toc: 'Toolbox Talks', dubai: 'Chapter 2',
    body: [
      'Supervisors will conduct a Daily Briefing with all personnel. Attendance will be mandatory for all operatives / personnel engaged on site.',
      'Specific Toolbox Talk sessions will be held regularly to relay specific safe systems of work set out in {{CO}} Method Statements.',
      'Toolbox Talk sessions should take approximately 10-15 minutes and will be given to groups of approximately 15-20 people unless very specific in nature.',
    ],
  },
  {
    id: 's8.6', level: 2, parent: 's8', title: 'Sub-Contractor Control', dubai: 'Chapter 2',
    body: [
      'Only Approved Sub-Contractors may be used. Refer to Project Manager if in doubt to check a contractor’s approval status.',
      'All Sub-contract employees will attend {{CO}} site induction.',
      'The Construction Manager and HSE Officer will ensure that daily checks are carried out on Sub-contractors with regard to compliance with site rules.',
      'Sub-contractors will be required to provide {{CO}} with appropriate Method statements and / or Risk Assessments for all elements of work prior to commencement. Where Sub-Con cannot furnish such documentation, {{CO}} will complete and issue for approval.',
      'Sub-contractors will be subject to continuous inspection by {{CO}} HSE Officers at any time. Repeated failure to comply with {{CO}} HSE Standards and site safety rules will result in disciplinary action and or removal from site.',
      'Subcontractors will provide {{CO}} with copies of relevant training and competence records as requested.',
    ],
  },
  {
    id: 's8.7', level: 2, parent: 's8', title: 'Welfare Facilities', dubai: 'Chapter 3',
    body: [
      'The Main Contractor will ensure that suitable and sufficient welfare facilities (sanitation, rest/sleeping areas, washing facilities & drinking water) are provided and that they are maintained in good, hygienic, condition at all times.',
    ],
  },
  {
    id: 's8.8', level: 2, parent: 's8', title: 'Working at Height', dubai: 'Chapter 4 / 8',
    body: [
      'All work at height must be carried out within the requirements laid down in relevant regulations, {{CO}} HSE standards and site rules.',
      'If the work cannot be carried out safely from the ground then the following options can be selected, in order of preference:',
      { ul: [
        'Mobile Elevating Work Platform (MEWP)',
        'Conventional Scaffold Systems (tube and fitting)',
        'Mobile Aluminium Tower Scaffold',
        'Step up Mini Scaffold / Podium Steps (height limited)',
        'Ladders / stepladders',
      ], deep: true },
      'Safety harnesses will be used when working at height where there is a danger of falling. Restraint harnesses will be used with MEWPs or when working on incomplete scaffold with missing edge protection.',
      'Shock absorbers will NOT be used unless the work is at a height of 5m or above.',
      'Stepladders may only be used for short duration work away from edges, regardless of edge protection. Stepladders will be footed by a second operative if working above 2m. Personnel working on stepladders must maintain 3 points of contact when working from the ladder.',
      'All scaffolds and mobile access towers must be of sound construction, erected, inspected and used by competent persons. All inspections will be recorded and the Scaff-Tag system used. Scaffolds and mobile scaffolds will be inspected weekly or when erected or altered.',
      'Independent scaffold will only be erected by qualified, certificated scaffolders trained in the erection of tube and fitting heavy duty scaffold. Operatives who are trained only to erect lightweight mobile aluminium scaffold will not be permitted to erect tube and fitting scaffold.',
      'Mobile tower scaffolds will be erected and used in accordance with the {{CO}} HSE Standard – 006 Mobile Aluminium Scaffold Towers.',
      'MEWPs will be used in accordance with the {{CO}} HSE Standard – 001 Mobile Elevating Work Platforms (MEWPs).',
      'Ladders and steps shall be used in accordance with {{CO}} HSE Standard – 003 Ladders and Steps.',
      'Fall Protection – Refer to HSE Standard – 014 Fall Protection.',
    ],
  },
  {
    id: 's8.9', level: 2, parent: 's8', title: 'Lifting Operations', dubai: 'Chapter 22',
    body: [
      'Lifting operations will be subject to the production of a MS/RA where the lift involves any of the following equipment:',
      { ul: [
        'Chain block',
        'Vertical material lift (e.g. genie lift)',
        'Use of tele-handler / forklift as a lifting device',
        'Mobile Cranes',
        'Tower Cranes',
      ], deep: true },
      'Mobile cranes will require the submission of a Main Contractor lifting operations permit. Use of tower cranes will be confirmed prior to start of works.',
      'All slinging of {{CO}} loads will be carried out by a qualified slinger / signaler.',
      'All lifting gear and accessories will be certified by a third party approved by {{LIFTAUTH}}. Certificates will be retained with the {{CO}} storekeeper and {{CO}} HSE Officer.',
    ],
  },
  {
    id: 's8.10', level: 2, parent: 's8', title: 'Plant, Tools & Equipment', dubai: 'Chapter 14 / 21',
    body: [
      'Portable appliances supplied by {{CO}} or Subcontractors will be inspected prior to use. Damaged or faulty electrical equipment will be returned to site stores.',
      'All tools and equipment used on the project will be issued in good order and will be checked daily by the user.',
      'All damaged tools and equipment will be replaced. Home-made tools will not be permitted.',
      'All {{CO}} plant and vehicles shall operate strictly within the Main Contractor Traffic Management Plan. Failure to do so may result in disciplinary action.',
    ],
  },
  {
    id: 's8.11', level: 2, parent: 's8', title: 'Noise Control', dubai: 'Chapter 3',
    body: [
      'Noise generated by site plant and operations must be kept to an absolute minimum at all times.',
      'Hearing protection will be made available to all operatives and will be mandatory to use when using equipment measured above 85dBA. Noise assessments will be carried out as necessary to determine requirements.',
    ],
  },
  {
    id: 's8.12', level: 2, parent: 's8', title: 'Electricity Onsite', dubai: 'Chapter 16',
    body: [
      'The Main Contractor will provide temporary electrical supply where necessary.',
      'RCDs (Residual Current Devices) will be fixed to any 220v / 380v tools brought onto site where this is available and technically practical.',
      'As a minimum, non 110v equipment will be double insulated and cables will be armoured or well protected from damage.',
      'The Main Contractor will provide general access lighting and emergency lighting. {{CO}} will provide adequate task lighting.',
      '{{CO}} will appoint a competent electrician for the maintenance and inspection of all {{CO}} Company electrical equipment / services. Inspections will be documented and copies held by the project HSE Officer.',
    ],
  },
  {
    id: 's8.13', level: 2, parent: 's8', title: 'Pressure Testing', dubai: 'Chapter 17',
    body: [
      'Pressure testing is regarded as a hazardous activity. Prior to pressure testing, the work area will be barricaded and adequate signage set out along the pipe system to be pressure tested.',
      'Prior to any high pressure testing activities being conducted on site, a permit will be required.',
    ],
  },
  {
    id: 's8.14', level: 2, parent: 's8', title: 'Hot Works / Welding Operations', dubai: 'Chapter 15',
    body: [
      'Electric Arc Welding (Steel Pipe): electrically operated welding equipment will only be used by qualified persons. Copies of welder’s qualification records will be submitted to the Main Contractor prior to the commencement of work.',
      'PPR (Polypropylene) is a thermoplastic piping system that will be used in the piped hot water systems. PPR pipe welding kits will only be used by competent persons.',
      'Cables for 220v or 380v equipment will be armoured or suitably protected.',
      'Firefighting equipment will be located at the workplace wherever welding work is being carried out.',
      'Hot works will be carried out in accordance with the {{CO}} HSE Standard – 007 Hot Works.',
      'Main Contractor’s Hot Work Permit will be required, prior to any types of hot work operations.',
    ],
  },
  {
    id: 's8.15', level: 2, parent: 's8', title: 'Personal Protective Equipment', dubai: 'Chapter 4',
    body: [
      'PPE used by {{CO}} employees on the project will be manufactured to a high standard and will meet EN/CE/ANSI standards where relevant. {{CO}} will ensure that all their employees are provided, free of charge, with all the necessary protective equipment to comply with all risk assessments and site safety rules.',
      'PPE shall be selected and used in accordance with {{CO}} HSE Standard 005 – Personal Protective Equipment Guidelines & HSE Standard 008 – Safety Glove Selection.',
      'PPE will be issued to all persons at induction.',
      'Safety helmets, safety boots and high visibility vests, as a minimum will be worn at all times on site by all staff and visitors.',
      'All operatives will be issued with hard hat, safety boots and high visibility vest. Ear plugs, Safety glasses, Goggles, Face Shield and additional items of equipment such as welding gloves, safety harnesses etc. will be issued as required by the task.',
      'Method statements and / or risk assessments will detail the required PPE for a task.',
    ],
  },
  {
    id: 's8.16', level: 2, parent: 's8', title: 'Protection of Public & Other Trades', dubai: 'N/A',
    body: [
      'The Main Contractor will be responsible for ensuring that visitors and members of the public are protected from injury when visiting or in close proximity to the site.',
      '{{CO}} recognizes their responsibility to protect the public / visitors and other trades from injury which may be caused by their activities on the project.',
      '{{CO}} employees and {{CO}} Sub-contractors will not disturb, remove or misuse any barriers, guards, warning signs, walkways, hoarding, fencing, lighting, netting etc. that have been erected by the Main Contractor or any other contractor working on the site / project.',
      '{{CO}} employees and {{CO}} Sub-contractors will be responsible for notifying the Main Contractor (via the {{CO}} Supervisor or Project Manager) of any damage to any of the above so that repair work can be carried out as soon as possible.',
    ],
  },
  {
    id: 's8.17', level: 2, parent: 's8', title: 'Permit to Work / Access Arrangements', dubai: 'Chapter 15 / 17',
    body: [{ slot: 'permits' }],
  },
  {
    id: 's8.18', level: 2, parent: 's8', title: 'Permit Procedure', dubai: 'N/A',
    body: [
      'Permits will only be issued by a competent person. A list of persons authorized to sign permits will be generated by the Project HSE Officer where APs are not appointed.',
      'Authorized Persons (APs) will be nominated for the implementation and operation of electrical and mechanical safe systems of work.',
      'Permits will be applied for a minimum of {{T02}} hours in advance of works commencing.',
    ],
  },
  {
    id: 's8.19', level: 2, parent: 's8', title: 'Confined Space Entry', dubai: 'Chapter 19',
    body: [
      'Entry into any confined space shall be planned and documented as required in order to identify and control potential hazards and this applies to all confined space entries and to anyone entering a confined space at site. Refer to {{CO}} HSE Standard 021.',
      'Confined space means a space that has any of the following characteristics:',
      { ul: ['limited openings for entry and exit;', 'unfavorable natural ventilation;', 'not designed for continuous worker occupancy.'], deep: true },
      'It includes, but is not limited to, boilers, pressure vessels, water tanks, fuel storage tanks, sewage tanks, pump rooms, compressor rooms, cofferdams, void spaces, duct keels, etc.',
      { sub: 'Potential Hazards' },
      { ul: ['Fire or Explosion;', 'Presence of harmful gases;', 'Access and egress;', 'Flooding leading to drowning;', 'Exposure to heat;', 'Emergency procedure.'], deep: true },
      { sub: 'Safety Precautions / Measures' },
      'Entry into a confined space is allowed only when a permit to enter has been issued and it is considered safe to do so, and then only remain inside for as long as it is necessary to carry out the work.',
      'It is the full responsibility of the concerned engineer to ensure that the confined space is safe to enter. Prior to entry into an enclosed space or tank the following procedure should be applied:',
      { ul: [
        'Ensure that Risk Assessment (RA) is done and precautions are taken accordingly.',
        'Confined space entry permit is obtained before entering.',
        'Establish testing of atmosphere by a competent person prior to entry where identified in the risk assessment.',
        'Also carry out ongoing monitoring of the atmosphere whilst work is being carried out.',
        'Isolation and lock off procedure must be followed to prevent gases, liquids or other free flowing materials entering the confined space.',
        'Flameproof electrical equipment shall be used in case of possible flammable gas atmosphere.',
        'Ensure that there is an agreed means of communication between those in the confined space & the person(s) appointed as the lookout / standby (Buddy system).',
        'Use PPE as prescribed in the Risk Assessment.',
        'Escape set breathing apparatus to be provided where there is a risk of a hazardous atmosphere developing.',
        'All persons entering a confined space must wear safety harnesses to facilitate rescue in an emergency situation.',
        'Ensure that safe access and egress are provided into and out of the confined space.',
        'Display appropriate warning signs and notices in languages that are easily understood by the work force.',
        'Before using open flames in a confined space, combustible gases or liquids must be removed if present; obtain a separate hot work permit and strictly follow all safety precautions mentioned therein.',
        'Manholes used for access should be rectangular, oval or circular in shape and be not less than 450mm x 407mm or 457mm diameter.',
        'Provide adequate trained supervision for the confined space working.',
        'Maintain attendance of people with their names, number and time of entry and exit from the confined space for any emergency purposes.',
        'Provide good ventilation in the confined space to prevent stale air & ensure that the air quality remains breathable.',
        'Remove any residue that may be present & may give rise to risk to workers working in confined spaces.',
        'In case of an excessive temperature reduce the time of working shifts and give frequent breaks.',
        'Make arrangements to ensure that workers do not become dehydrated whilst working in excessive temperatures.',
        'Establish and communicate an emergency procedure to deal with rescue or recovery of any workers who become injured or dehydrated.',
        'Practice the evacuation drills on regular basis.',
      ] },
      { sub: 'Confined Space Emergency Rescue Procedure' },
      'Emergency procedure shall be in place and communicated to workers so as to safely remove employees trapped / injured in a confined space with little or no risk to other employees.',
      'Note: Emergency rescue from a confined space by trained personnel shall occur only in cases of immediately life threatening occurrences such as heart attack or lack of consciousness. {{CIVILDEF}} will perform all other Emergency rescue.',
      'Rescue equipment to be used by personnel includes a tripod with retrieval system and full body harnesses to be worn by employees going into the confined space.',
      'The tripod will be set up off to the side of manholes and checked for stability prior to entry by the safety observer and individuals who will be working in the confined space. Once opened, the individuals involved will place the tripod over the manhole to assure that it will fit the area and be stable for rescue. The tripod then can be moved back to the side of the manhole.',
      'Personnel entering the confined space will put the full body harnesses on before going into the space. All atmospheric testing and ventilation shall be conducted according to the established confined space entry permit.',
      'Under no circumstances will the safety observer / standby enter the confined space.',
      { sub: 'Emergency Rescue Procedure' },
      { ul: [
        'If for any reason during the course of working in the confined space an employee becomes ill or injured and a removal must be carried out, the following procedure applies:',
        'The safety observer will immediately raise the alarm to call for help by giving location and condition of individual needing assistance using the Site Emergency Contact Number.',
        'The site Emergency Response Plan will be initiated.',
        'The observer will remain in contact with individuals in the confined space. If removal (of employee in space not breathing or suffering a heart attack) by the Site Emergency Response Team must be conducted, the observer will position the tripod over the manhole and lower the cable for the second individual to attach to the incapacitated individual’s harness.',
        'Once the cable is attached, the second individual in the space will signal the observer either verbally or by hand gestures to begin removal of the injured employee. The second individual will assist by guiding the injured person through the space while the safety observer uses the retrieval system to pull the injured person out of the space.',
        'Once removed from the space, individuals trained in CPR (Site Male Nurse / First Aider) will begin to assist and assess the injured employee’s condition and determine the next course of action.',
      ] },
    ],
  },
  {
    id: 's8.20', level: 2, parent: 's8', title: 'Audit & Inspection', dubai: 'Chapter 2',
    body: [
      'The project will be subject to continuous Inspection with regard to Health, Safety and Environment control.',
      'HSE concerns and required actions will be recorded on the Daily and Weekly HSE Inspection reports. Any HSE issues received from external parties e.g. Main Contractor or Local Authorities will be recorded in the Project HSE Inspection registers. The HSE Inspection Register will be maintained by the Project HSE Officer and close out of HSE issues recorded.',
      '{{CO}} Corporate HSE Department will conduct regular HSE audits of the project, implementing action plans for all observations and NCRs identified. {{CO}} Project Managers are responsible for closing out any audit actions by the required action date.',
    ],
  },
  {
    id: 's8.21', level: 2, parent: 's8', title: 'Accident / Incident Reporting', dubai: 'Chapter 2',
    body: [
      'All incidents (accidents resulting in injury or causing illness to {{CO}} employees or its sub-contractors) and events (near-miss accidents) will be reported in order to:',
      { ul: [
        'Establish a written record of factors which led to or could have led to injuries, illnesses, and occurrences as well as property and vehicle damage.',
        'Promptly investigate incidents and events in order to initiate and support corrective and / or preventive action.',
        'Provide statistical information for use in analyzing all incidents and events involving {{CO}} personnel and its sub-contractors and monitor performance against objectives.',
        'Comply with local regulations.',
      ] },
      'All accidents and incidents shall be reported via the Accident / Incident Register.',
      'The Accident / Incident reporting requirements apply to all incidences involving {{CO}} and its sub-contractor personnel arising out of or in the course of employment which results in personal injury, illness, and / or property and vehicle damage.',
      'Events (Near Misses), which, strictly by chance, do not result in actual or observable injury, illness, death, or property damage, are required to be reported. The information obtained from such reporting can be extremely useful in identifying and mitigating problems before they result in actual personal or property damage.',
      'An example of a near miss incident required to be reported is material falling from a height that does not result in an injury or damage to property.',
    ],
  },
  {
    id: 's8.22', level: 2, parent: 's8', title: 'Accident / Incident Investigation', dubai: 'Chapter 2',
    body: [
      'The Project HSE Officer will review each reported Accident / incident and event to determine if further investigation is required. All Lost Time Incidents (LTI) will be investigated by the Project Manager.',
      'Major and fatal accidents will require senior personnel including the Corporate HSE Manager and Senior Operations Manager to perform the investigation.',
      'Recommendations for corrective and / or preventative actions necessary to reduce or eliminate hazardous conditions will be generated.',
      'Investigations will be recorded and documented. Findings and recommendations will be formally reported.',
      { slot: 'flowchart' },
    ],
  },
  {
    id: 's8.23', level: 2, parent: 's8', title: 'Communication & Consultation', dubai: 'Chapter 2',
    body: [
      '{{CO}} will ensure that all employees are provided with adequate information with regard to health, safety and welfare on commencement and during their employment on the project.',
      'Project notice boards will display relevant safety information, safety alerts and accident statistics.',
      '{{CO}} employees have the right to bring health, safety, environmental and welfare concerns directly to the attention of the Project Manager or Project HSE Officer, or their appointed deputies, who will be obliged to investigate all complaints or concerns brought forward by any employee. Feedback to those raising the complaint / concern will be within 48 hours.',
      'A weekly HSE Meeting shall be held where an employee representative will be in attendance to raise any HSE concerns to the project manager. The weekly HSE Meeting shall be attended by the following personnel:',
      { ul: ['Project Manager', 'Construction Manager(s)', 'HSE Manager', 'HSE Officers', 'Project Engineers / Supervisors', 'Employee Representative'], deep: true },
      'In addition to the internal weekly HSE Meeting, {{CO}} Project Management & HSE Teams shall attend Main Contractor Weekly HSE Meetings as arranged by Main Contractor.',
    ],
  },
  {
    id: 's8.24', level: 2, parent: 's8', title: 'Risk / Impact Assessments', dubai: 'Chapter 2',
    body: [
      'Risk assessments will be generated prior to carrying out specific tasks.',
      'It is the responsibility of the Project HSE Manager to generate a risk assessment prior to works commencing.',
      'A majority of assessments will be task based and produced during construction. However a project risk register will be developed for all those risks / impacts foreseeable in advance.',
      'The project risk register will be issued to all Supervisors and Construction / Project Managers and will be used as a basis for generating site wide and task method statements.',
      'Appropriate control measures will be identified and noted in the risk assessment document.',
      'The findings of the Risk Assessment will be communicated to all employees and their signatures will be obtained on the Training Attendance Register as proof that they have been made aware, that they understand the identified risks and hazards, and to ensure that they will comply with the control measures put into place.',
    ],
  },
  {
    id: 's8.25', level: 2, parent: 's8', title: 'Project Method Statements', dubai: 'Chapter 2',
    body: [
      'The key feature of method statements is that they provide a sequence for carrying out a task, under the control of the contractor. Some work activities must be done in sequence to ensure safety.',
      '{{CO}} Method statements will incorporate risk / impact assessments and a separate form need not be addressed. {{CO}} method statements will be documented and submitted to the Main Contractor for review and approval.',
    ],
  },
  {
    id: 's8.26', level: 2, parent: 's8', title: 'Storage of Materials at Site', dubai: 'Chapter 3',
    body: [
      'The following rules will apply to materials stored on site:',
      { ul: [
        'Materials and consumables will be protected from the elements and stored on pallets and covered.',
        'Items will be stacked safely and secured.',
        'Flammable substances will only be ordered in small containers and will be stored in shaded location out of direct sunlight.',
        'No fuel will be stored in the {{CO}} stores.',
        'Heavy items of equipment will not be stacked or stored at high level and will be stored so that easy access is available for the tele-handler or forklift.',
      ], deep: true },
      'The {{CO}} stores compound will be maintained in a clean and tidy manner. Records of stores issues will be maintained.',
      'Stores issued to site will not be located in access / egress routes and will not be stacked close to an edge. Materials located on site will be stacked in lay down areas agreed with the Main Contractor.',
      'Where possible, packaging materials will be removed from site at the earliest opportunity in order to reduce the fire load.',
      'Storage of combustible materials will be carried out in accordance with the {{CO}} HSE Standard 002 – Storage of Combustible Materials.',
    ],
  },
  {
    id: 's8.27', level: 2, parent: 's8', title: 'Control of Substances Hazardous to Health (COSHH) / MSDS', dubai: 'Chapter 18',
    body: [
      'All the employees will be properly informed and trained prior to using substances hazardous to health. A COSHH Risk Assessment will be required. Where identified, the risk assessment will be carried out, incorporating the relevant MSDS. The manner in which this shall be carried out is detailed in SWP – 015 COSHH.',
      'Where required, COSHH Risk Assessments will be conducted by the relevant supervisors, prior to using the chemicals on the site.',
      'A separate COSHH Store will be maintained to prevent risk to health from hazardous substances and fire.',
      'Materials will be stored, handled and disposed of in accordance with the guidelines on the MSDS.',
      'A register of all hazardous chemicals shall be maintained by the project storekeeper, with an updated copy forwarded to the HSE Department on a weekly basis.',
    ],
  },
  {
    id: 's8.28', level: 2, parent: 's8', title: 'Delegation of Responsibilities', dubai: 'Chapter 2',
    body: [
      'Certain activities will be classed as safety critical. Safety critical roles will require the formal appointment of a competent person(s) to oversee the activity. These persons will be referred to as APs (Appointed Persons). Where required, there may be a Senior AP managing a team of APs within one function.',
      '{{CO}} safety critical roles on the project will be, but are not limited to, the following:',
      { ul: [
        'Electrical AP (Responsible for implementation of ESSW – Electrical Safe System of Work).',
        'Mechanical AP (Responsible for implementation of MSSW – Mechanical Safe System of Work).',
        'Crane AP (Responsible for crane lifting operations).',
        'Mobile Tower Scaffold Inspector / Ladder Inspector.',
      ], deep: true },
    ],
  },
  {
    id: 's8.29', level: 2, parent: 's8', title: 'Waste Management & Ground Contamination', dubai: 'Chapter 3',
    body: [
      'Housekeeping is a significant safety and environmental issue.',
      'Waste materials will be removed from site as soon as possible.',
      'Hazardous waste materials such as empty / part empty containers of paints, solvents, pipe cements, adhesives etc. will be disposed of in the appropriate skip, provided by the Main Contractor. {{CO}} shall comply with all aspects set out within the Main Contractor Waste Management Plan.',
      'All materials of this nature will be removed from site and disposed of in a timely manner. Note: Only small containers of hazardous materials will be issued to site, typically 1 litre in size. This will limit environmental damage if the material is spilled or discarded.',
      'Contamination may occur due to the spillage of oils or the release of chemicals into the ground. No oil, diesel or petrol will be stored on site in order to eliminate the possibility of unplanned spillage.',
      'During cleaning and flushing works chemicals will be used to clean the pipe work systems. Contaminated water from these works will not be released into the drainage system. Contaminated water will be stored and removed from site for disposal at a licensed facility.',
    ],
  },
  {
    id: 's8.30', level: 2, parent: 's8', title: 'Heat Stress Management', dubai: 'Chapter 3.15',
    body: [
      '{{CO}} will follow the requirements set out in the Main Contractor Heat Stress Management Plan or Summer Working Plan. {{CO}} will coordinate closely with the Main Contractor to ensure the Heat Stress Management Plan is effective at project site.',
    ],
  },
  {
    id: 's8.31', level: 2, parent: 's8', title: 'HSE Violations', dubai: 'Chapter 2',
    body: [
      '{{CO}} Project Management shall not regard punishment and penalties as corrective actions; instead, Training, Awareness, Re-Inductions, counseling and advice and if necessary a change in procedure or Method Statement may be required. Every HSE violation shall be investigated to determine the root cause and analyzed to identify trends.',
      'The following Warnings shall be utilized within the project:',
      { slot: 'warnings' },
    ],
  },
  {
    id: 's8.32', level: 2, parent: 's8', title: 'Horseplay and Violence', dubai: 'Chapter 2',
    body: [
      'Horseplay and violence within the project or any building, camp or vehicle associated with the project is strictly forbidden. Employees who engage in Horseplay or violence shall be subject to strict disciplinary action.',
    ],
  },
  {
    id: 's9', level: 1, title: 'HSE Objectives & Targets', dubai: 'N/A',
    body: [
      '{{CO}} shall ensure a clear set of HSE objectives, aims and targets are set for the duration of the project. These Objectives, aims and targets will be reviewed on a regular basis and action plans implemented to ensure targets are met. The following objectives, aims and targets will be introduced for the {{PROJECT}} project.',
    ],
  },
  { id: 's9.1', level: 2, parent: 's9', title: 'HSE Objectives', dubai: 'N/A', body: [{ slot: 'objectives' }] },
  { id: 's9.2', level: 2, parent: 's9', title: 'HSE Targets', dubai: 'N/A', body: [{ slot: 'targets' }] },
  {
    id: 's9.3', level: 2, parent: 's9', title: 'Employee of the Month Award Scheme', dubai: 'N/A',
    body: [
      'Every month an {{CO}} employee shall be selected for an award of {{AWARD}}. Only the most dedicated and talented employees shall be put forward by their Supervisor for the employee of the month award. The employee will be recognized for their attitude and commitment within the project, their contribution to operational success and their contribution towards health and safety within the project. An awards ceremony shall take place monthly with the Project Manager and HSE Manager in attendance. The awards ceremony shall be recorded and details placed on the project notice board for all to see and aspire to.',
    ],
  },
];

/** Appendices (one page each, after Section 9). */
export const APPENDICES: { id: string; key: 'org' | 'iso' | 'risk' | 'env' | 'contacts'; title: string; added?: boolean }[] = [
  { id: 'app:org', key: 'org', title: 'Project HSE Organization Chart' },
  { id: 'app:iso', key: 'iso', title: 'ISO 45001:2018 Certificate' },
  { id: 'app:risk', key: 'risk', title: 'Project Risk Register' },
  { id: 'app:env', key: 'env', title: 'Environmental Impact Register' },
  { id: 'app:contacts', key: 'contacts', title: 'Emergency Contact Numbers', added: true },
];

/** 4. Terms & Definitions, rows 5 onwards (rows 1–4 are the project parties). */
export const TERMS: { term: string; def: string; bullets?: string[]; after?: string; bold?: string }[] = [
  { term: 'Accident', def: 'An accident is any unplanned event that results in injury or ill health of people, or damage or loss to property, plant, materials or the environment or loss of a business opportunity.' },
  { term: 'ALARP', bold: 'As Low As Reasonably Practicable.', def: ' Means to reduce a risk to a level that is as low as reasonably practicable and involves balancing reduction in risk against the time, trouble, difficulty and cost of achieving it. This level represents the point, objectively assessed, at which the time, trouble, difficulty and cost of further reduction measures becomes unreasonably disproportionate to the additional risk reduction obtained.' },
  { term: 'Audit (HSE)', def: 'Independent, systematic and documented process of objectively obtaining and evaluating verifiable evidence to determine that HSE controls are in place.' },
  { term: 'COSHH', def: 'Control of substances hazardous to health' },
  { term: 'Engineering controls', def: 'The control of exposure to a hazardous agent by the design of plant and equipment, e.g. containment, exhaust ventilation, mechanical aids.' },
  { term: 'Environment', def: 'Surroundings in which an organization operates including air, water, land, natural resources, flora, fauna, humans and their interrelation.' },
  { term: 'Environmental impact', def: 'Any change to the environment, whether unfavourable or beneficial, wholly or partially resulting from the organization’s activities, products or services.' },
  { term: 'First Aid', def: 'A work related injury or illness that does not require medical treatment by physician.' },
  { term: 'Hazard', def: 'Any substance, physical effect, or condition with potential to harm people, property or the environment or affect the company reputation.' },
  { term: 'HSE', def: 'Health, Safety & Environment' },
  { term: 'HSEMS', def: 'HSE Management System. The company structure, responsibilities, practices, procedures, processes and resources for implementing health, safety and environment management.' },
  { term: 'Incident', def: 'All undesired events or circumstances including “Near Misses” having the potential to cause accidents.' },
  { term: 'Inspection (HSE)', def: 'Physical on site verification that work is performed and equipment is maintained in accordance with existing HSE standards and procedures. Persons that are independent from or are part of the operations organization (e.g. senior supervisors and managers) can conduct HSE Inspections.' },
  { term: 'LTI', def: 'Lost Time Injury: Any type of work related injury that requires medical treatment and / or is booked into medical rest by a medical physician and therefore prevents the injured person performing their usual or similar job on a subsequent work day or shift.' },
  { term: 'Lost Work Day (LWD)', def: 'Total number of scheduled workdays including holidays in which the injured person was temporarily unable to work.' },
  { term: 'MSDS', def: 'Material Safety Data Sheet' },
  { term: 'MTC', def: 'Medical Treatment Case (when an employee is referred to hospital and surgery / IV is administered by physician).' },
  { term: 'Near Miss', def: 'An event or chain of events that could have resulted in fatality, injury, illness and / or damage (loss) to assets, the environment, company reputation or third parties.' },
  { term: 'Occupational Illness', def: 'Any work related abnormal condition or disorder, other than an injury, which is mainly caused by exposure to environmental factors associated with the employment. It includes acute and chronic illness or diseases that may be caused by inhalation, absorption, ingestion or direct contact.' },
  { term: 'Occupational Injury', def: 'Any cut, fracture, sprain, amputation, etc. which results from a work incident or from an exposure involving a single event (or a number of linked events close together in time) in the work environment.' },
  { term: 'Performance Indicator', def: 'A ‘vital sign’ indicator showing the extent of successful performance against set criteria over time.' },
  { term: 'PPE', def: 'Personal Protective Equipment. The collective term describing clothing and equipment used to protect the individual against agents hazardous to health.' },
  { term: 'Procedure', def: 'A documented series of steps to be carried out in a logical order for a defined operation or in a given situation.' },
  { term: 'Property Damage', def: 'A loss or damage to equipment, buildings, structures etc. due to an unintended event.' },
  { term: 'Review', def: 'Periodic review of HSE performance and effectiveness of HSEMS by means of documented performance data. HSE review is conducted at multiple organization levels in varying level of detail.' },
  {
    term: 'Risk', def: 'Risk is the product of the measure of the likelihood of occurrence of an undesired event and the potential adverse consequences which this event may have upon:',
    bullets: [
      'People – injury or harm to physical or psychological health.',
      'Asset (or Revenue) – damage to property (assets) or loss of production.',
      'Environment – water, air, soil, animals, plants and social.',
      'Reputation – employees and third parties. This includes the liabilities arising from injuries and property damage to third parties.',
    ],
    after: 'Risk = Frequency x Consequences',
  },
  { term: 'Risk Assessment', def: 'The process of determination of risk, usually in a quantitative or semi-quantitative manner. It is an evaluation of the likelihood of undesired events and the likelihood of harm or damage being caused together with the value judgments made concerning the significance of the results.' },
  { term: 'Risk Management', def: 'The process of implementing decisions about accepting or altering risks.' },
  { term: 'Safe', def: 'A situation is categorized as safe if its risks are known and judged.' },
  { term: 'Waste', def: 'Any material to be disposed of as being of no further primary use including solid, liquid and gaseous effluents.' },
];

/** 8.31 HSE Violations: the three warning levels. */
export const WARNINGS: { level: string; who: string[]; action: string[] }[] = [
  {
    level: 'First Warning',
    who: ['Staff – Written Warning to be noted on employee file and in violation register within the project HSE Department.', 'Worker – Verbal Warning to be included in the violation register.'],
    action: [
      'Employee shall be informed of the violation along with the correct safe practice and or procedure.',
      'Employee shall indicate understanding of correct safe practice or procedure.',
      'Future violations shall result in higher levels of discipline and may lead to dismissal.',
    ],
  },
  {
    level: 'Second Warning',
    who: ['Staff – Written Warning to be given and copy to Project Manager and Regional Area Director.', 'Worker – Individual will be issued with a warning notice and to undergo HSE Induction training again.'],
    action: [
      'Employee shall be referred to applicable HSE requirements and standards for review.',
      'Responsible Supervisor, Project Manager and HR Department shall be given a copy of the warning for their personal file.',
    ],
  },
  {
    level: 'Third Warning',
    who: ['Staff – Immediate Suspension from work and report to the Regional Area Director and Group HSE Manager for further investigation and action.', 'Worker – Immediate Suspension from work and report to the Group HSE Manager for further evaluation.'],
    action: [
      'The employee may be given a final warning depending on the severity of the violation.',
      'Future recurrence of the same violation may lead to dismissal.',
    ],
  },
];

/** Corrections made to the sample text (shown in the About panel and the project notes). */
export const CORRECTIONS = [
  'Sub-sections of Section 5 renumbered 5.1, 5.2, 5.3 (the sample has 5.1 twice).',
  'Section 8: the missing heading 8.23 Communication & Consultation added, so Risk / Impact Assessments is 8.24 and Project Method Statements 8.25, as in the sample’s table of contents.',
  'Section 9: 9.1 HSE Objectives, 9.2 HSE Targets and 9.3 Employee of the Month Award Scheme, as in the sample body.',
  'The sample’s placeholders (XXXXXX, Emaar Golf Heights) are replaced by the project name; Terms & Definitions rows 1–4 by the project parties.',
  'Wording: "Only the most dedicated and talented employees" (9.3, a word was missing in the sample); 8.14 and 8.19 sentences completed.',
  'Added in this revision: Appendix 2, the ISO 45001:2018 certificate, referred to in Section 5; the Project Risk Register (Appendix 3) and the Environmental Impact Register (Appendix 4) printed in full, with the Oxypro risk criteria.',
  'Spelling: committed, activities, limited, responsibilities, interrelationship, occurrence, evaluation, employment, similar, Asset, Equipment, Working at Height, Personal Protective Equipment, Mobile Elevating Work Platforms.',
];
