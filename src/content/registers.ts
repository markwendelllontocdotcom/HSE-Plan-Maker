import type { RiskRow, EnvRow } from '../model/types';

/**
 * Appendix 3 Project Risk Register and Appendix 4 Environmental Impact Register.
 * Risk criteria, colours and columns follow the Oxypro Risk Assessment form OXY-QHSE-F-RA-01 (5 x 5, score = L x S).
 */

export const LIKELIHOOD: [number, string, string][] = [
  [5, 'Almost Certain', 'Expected to occur in most circumstances'],
  [4, 'Likely', 'Will probably occur in most circumstances'],
  [3, 'Possible', 'Might occur at some time'],
  [2, 'Unlikely', 'Could occur but not expected'],
  [1, 'Rare', 'May occur only in exceptional circumstances'],
];
export const SEVERITY: [number, string, string][] = [
  [1, 'Insignificant', 'No injury / near miss; negligible damage'],
  [2, 'Minor', 'First-aid case; minor damage'],
  [3, 'Moderate', 'Lost-time injury / medical treatment; moderate damage'],
  [4, 'Major', 'Serious injury / permanent disability; significant damage'],
  [5, 'Catastrophic', 'Fatality / multiple serious injuries; major damage or environmental impact'],
];
/** Environmental severity of an impact (same 1-5 scale). */
export const ENV_SEVERITY: [number, string, string][] = [
  [1, 'Insignificant', 'Negligible or no environmental impact'],
  [2, 'Minor', 'Small, short-term impact on site, easily reversed'],
  [3, 'Moderate', 'Impact on site needing clean-up or containment; complaint'],
  [4, 'Major', 'Significant impact beyond the site; authority notice or fine'],
  [5, 'Catastrophic', 'Widespread or long-term damage; prosecution or work stopped'],
];

export type Band = { key: 'LOW' | 'MEDIUM' | 'HIGH'; from: number; to: number; fill: string; color: string; label: string; action: string };
export const BANDS: Band[] = [
  { key: 'LOW', from: 1, to: 4, fill: '92D050', color: '000000', label: 'Acceptable', action: 'Proceed with work under existing controls; monitor and maintain controls through routine supervision.' },
  { key: 'MEDIUM', from: 5, to: 12, fill: 'FFFF00', color: '000000', label: 'Tolerable', action: 'Work may proceed only with additional control measures in place to reduce risk to ALARP, under competent supervision and approved permits.' },
  { key: 'HIGH', from: 15, to: 25, fill: 'FF0000', color: 'FFFFFF', label: 'Unacceptable', action: 'Work shall NOT start/continue until the risk is reduced. Re-assess and obtain Project Manager & HSE Manager approval before proceeding.' },
];
export const RISK_NOTES = [
  'Residual risk shall be Low or Medium (ALARP) before work begins.',
  'Controls follow the hierarchy: Elimination → Substitution → Engineering → Administrative → PPE.',
  'The register is reviewed whenever the scope, method, equipment or site conditions change and after any incident or near miss. Task risk assessments in the method statements are made from it.',
];

/** Environmental significance: a score (L x S) of 8 or more is a significant environmental aspect. */
export const SIGNIFICANT_FROM = 8;
export const SIG_BANDS = [
  { key: 'No', from: 1, to: SIGNIFICANT_FROM - 1, fill: '92D050', color: '000000', label: 'Not significant', action: 'Controlled through routine site practice, housekeeping and HSE inspections.' },
  { key: 'Yes', from: SIGNIFICANT_FROM, to: 25, fill: 'FFFF00', color: '000000', label: 'Significant', action: 'Controlled as listed in this register, briefed at the HSE induction and toolbox talks, checked at HSE inspections and considered when setting the HSE objectives and targets.' },
];
export const CONDITIONS: [string, string][] = [['N', 'Normal'], ['A', 'Abnormal'], ['E', 'Emergency']];
export const ENV_NOTES = [
  'Condition: N = normal operation; A = abnormal (start-up, shutdown, testing, maintenance); E = emergency (spill, fire, flood).',
  'Environmental aspects are identified as set out in the company QHSE Manual (6.1.2.2 Environmental Aspect).',
  'The register is reviewed whenever the scope, method, materials or site conditions change and after any environmental incident or complaint.',
];

export const score = (l: number, s: number) => (l > 0 && s > 0 ? l * s : 0);
export function band(sc: number): Band | null {
  if (!sc) return null;
  return BANDS.find((b) => sc >= b.from && sc <= b.to) || (sc > 12 ? BANDS[2] : BANDS[1]);
}
export const significant = (sc: number) => sc >= SIGNIFICANT_FROM;

/** Project Risk Register rows: the OXYPRO MEP Risk Assessment Master Reference Rev 00 (OXY-QHSE-RA-GEN-001), steps 01-32,
 *  with the heat stress step of the RA library added before the emergency response step. */
export const RISK_ROWS: RiskRow[] = [
  {
    "activity": "Mobilisation, site induction and work-area handover",
    "hazards": "Unfamiliar site hazards; unauthorised access; simultaneous operations; inadequate permits or coordination",
    "persons": "All workers, supervisors, other trades",
    "L": 3,
    "S": 3,
    "controls": "Complete site induction and task briefing; confirm approved drawings, scope, work sequence, access and area handover.\nObtain required PTW and authority/client approvals.\nCoordinate with other trades and identify live services, restricted zones and emergency routes.\nStop and reassess when conditions differ from the briefing.",
    "L2": 1,
    "S2": 3,
    "resp": "Project Manager / Site Engineer / HSE Officer"
  },
  {
    "activity": "Delivery, unloading, storage and internal transportation of MEP materials / equipment",
    "hazards": "Vehicle movement; dropped loads; crushing; manual-handling injuries; unstable stacking; damage to equipment",
    "persons": "Drivers, storekeepers, workers, nearby personnel",
    "L": 3,
    "S": 4,
    "controls": "Use designated delivery routes, banksman and segregated unloading zone.\nVerify vehicle and lifting-aid suitability and SWL.\nUse trolleys/pallet trucks or mechanical aids; team-lift only where assessed.\nStore materials on stable level surfaces, secure cylinders and long items, protect equipment and keep access/escape routes clear.",
    "L2": 1,
    "S2": 4,
    "resp": "Logistics Coordinator / Storekeeper / Supervisor / HSE"
  },
  {
    "activity": "Manual handling of pipes, ducts, cable trays, equipment and materials",
    "hazards": "Strains, sprains, crushed fingers/toes, sharp edges, awkward posture",
    "persons": "All handling personnel",
    "L": 3,
    "S": 3,
    "controls": "Assess load weight, size and route before lifting.\nUse mechanical aids or split loads; team lift bulky items with one leader.\nPlan the route, use correct posture, wear suitable gloves and safety footwear, and do not carry loads that obstruct vision.",
    "L2": 1,
    "S2": 3,
    "resp": "Supervisor / Workers"
  },
  {
    "activity": "Work at height using ladders, mobile towers, scaffolds or MEWPs",
    "hazards": "Falls from height; falling tools/materials; platform overturning; contact with overhead services",
    "persons": "Installers, persons below, other trades",
    "L": 4,
    "S": 4,
    "controls": "Avoid work at height where practicable.\nUse inspected, tagged scaffold or suitable MEWP operated by trained personnel; check ground conditions, guardrails, gates and access.\nLadders are for short-duration, light work only and must be secured.\nUse harness/restraint only where specified with suitable anchor and rescue plan.\nBarricade below and secure tools/materials.",
    "L2": 2,
    "S2": 4,
    "resp": "Site Engineer / Supervisor / HSE Officer"
  },
  {
    "activity": "Setting out, drilling, chasing, coring and cutting",
    "hazards": "Dust, noise, flying fragments, hand injury, electric shock, fire, damage to concealed services or post-tension tendons",
    "persons": "Operators, nearby workers, persons below",
    "L": 3,
    "S": 4,
    "controls": "Check approved drawings and scan for concealed electrical, plumbing, rebar and post-tensioning before drilling/coring.\nObtain approval for structural penetrations.\nUse guarded tools, dust extraction/wet method, correct discs/bits and inspected leads.\nIsolate nearby services where required; wear eye, hearing and respiratory protection.\nSecure workpiece and barricade area.",
    "L2": 1,
    "S2": 4,
    "resp": "Site Engineer / Supervisor / HSE Officer"
  },
  {
    "activity": "Installation of supports, brackets, anchors, inserts and seismic restraints",
    "hazards": "Anchor failure; falling services; overhead drilling; sharp edges; work-at-height exposure",
    "persons": "Installers, persons below, future occupants",
    "L": 3,
    "S": 4,
    "controls": "Use approved support details and compatible, certified anchors.\nConfirm substrate, edge distances, embedment and load capacity; do not cut reinforcement or PT tendons without written approval.\nInstall and test anchors as specified; provide required seismic restraints.\nInspect supports before loading and protect exposed threaded rods.",
    "L2": 1,
    "S2": 4,
    "resp": "Discipline Engineer / Supervisor / QA/QC"
  },
  {
    "activity": "Installation of HVAC equipment, FCUs, AHUs, fans, pumps and packaged units",
    "hazards": "Dropped equipment; crush/trap points; lifting failure; vibration; unstable supports; sharp edges",
    "persons": "Installers, riggers, nearby personnel",
    "L": 4,
    "S": 4,
    "controls": "Use an approved lifting plan where required, competent lifting team and certified/inspected equipment.\nVerify weight, centre of gravity, lifting points and SWL.\nEstablish exclusion zone and use tag lines where suitable.\nSecure equipment to verified supports before releasing lifting gear; keep hands clear of pinch points and check access/maintenance clearances.",
    "L2": 2,
    "S2": 4,
    "resp": "Lifting Supervisor / Mechanical Engineer / HSE"
  },
  {
    "activity": "Installation of ductwork, dampers, louvers and air terminals",
    "hazards": "Falling duct sections; sharp sheet-metal edges; unstable temporary supports; dropped tools; work at height",
    "persons": "Duct installers, persons below, adjacent trades",
    "L": 3,
    "S": 4,
    "controls": "Use approved shop drawings and support spacing.\nInstall temporary supports before releasing lifting aids; do not overload supports.\nUse team lifts or mechanical aids for large sections, gloves for sharp edges, tool lanyards where needed and a barricaded area below.\nVerify fire/smoke damper orientation and access before closure.",
    "L2": 1,
    "S2": 4,
    "resp": "HVAC Engineer / Duct Supervisor / HSE"
  },
  {
    "activity": "Installation of chilled-water, condenser-water, heating and other mechanical pipework",
    "hazards": "Pipe movement; dropped sections; cuts; joint failure; pressure release; hot/cold surfaces",
    "persons": "Pipefitters, helpers, nearby workers",
    "L": 3,
    "S": 4,
    "controls": "Verify approved drawings, material compatibility and support spacing.\nCap open ends, secure pipe before cutting/joining, use correct tools and protect sharp edges.\nProvide safe access and temporary supports.\nConfirm valve orientation, flow direction and maintainability.\nKeep people clear of suspended pipe and do not load incomplete supports.",
    "L2": 1,
    "S2": 4,
    "resp": "Mechanical Engineer / Pipework Supervisor"
  },
  {
    "activity": "Installation of plumbing, drainage, sanitaryware and water services",
    "hazards": "Leaks/flooding; biological contamination; manual handling; sharp tools; exposure to sewage or contaminated water",
    "persons": "Plumbers, cleaners, occupants, other trades",
    "L": 3,
    "S": 3,
    "controls": "Isolate existing services before tie-in and confirm no live flow.\nUse hygiene precautions and suitable gloves/eye protection when handling sewage or contaminated water.\nSecure pipework, cap open ends, protect finished surfaces and clean spills immediately.\nVerify gradients, traps, vents and access for maintenance against approved drawings.",
    "L2": 1,
    "S2": 3,
    "resp": "Plumbing Engineer / Supervisor"
  },
  {
    "activity": "Installation of fire-fighting, LPG/gas and fire-protection systems",
    "hazards": "Pressurised lines; gas release; ignition; heavy components; impairment of fire systems; wrong materials or connections",
    "persons": "Installers, other trades, building occupants",
    "L": 4,
    "S": 4,
    "controls": "Use approved drawings/materials and competent authorised personnel.\nObtain permits and isolate/notify the responsible party before impairing an existing system.\nProhibit ignition sources for gas work; provide ventilation and gas testing where required.\nVerify line identification, supports and connections.\nReinstate and notify the system owner promptly after testing.",
    "L2": 2,
    "S2": 4,
    "resp": "Fire Protection Engineer / Supervisor / HSE"
  },
  {
    "activity": "Electrical containment, cable tray, trunking and conduit installation",
    "hazards": "Falls; sharp edges; dropped sections; contact with live services; drilling hazards; overloaded supports",
    "persons": "Electricians, helpers, other trades",
    "L": 3,
    "S": 4,
    "controls": "Confirm routes and service clearances.\nScan before drilling; use approved supports and safe access equipment.\nIsolate nearby services when required, protect cut edges and deburr.\nSecure containment before loading and observe segregation, fill and bending requirements.\nDo not use installed containment as a walkway or lifting point.",
    "L2": 1,
    "S2": 4,
    "resp": "Electrical Engineer / Supervisor"
  },
  {
    "activity": "Cable pulling, termination, glanding and electrical panel installation",
    "hazards": "Electric shock/arc flash; stored energy; cable recoil; crush injuries; heavy panels; incorrect termination",
    "persons": "Electricians, commissioning personnel, nearby workers",
    "L": 4,
    "S": 5,
    "controls": "Only competent authorised electricians may perform electrical work.\nApply lockout/tagout (LOTO), prove dead using an approved tester and prove the tester before/after use.\nUse arc-rated PPE and boundaries where the risk assessment requires them.\nUse rollers and pulling aids, control cable tension and communication, verify circuit identification/torque and keep panels secured.",
    "L2": 2,
    "S2": 5,
    "resp": "Electrical Engineer / Authorised Person / HSE"
  },
  {
    "activity": "ELV, data, CCTV, access control, BMS and control-system installation",
    "hazards": "Work at height; low-voltage shock; damaged cables; incorrect connections; interaction with live systems and sensitive equipment",
    "persons": "ELV technicians, electricians, other trades",
    "L": 3,
    "S": 3,
    "controls": "Use approved schematics and cable schedules; identify and isolate circuits where required.\nSegregate ELV and power cables as specified, protect fibre/copper ends, use correct test equipment and control access to live panels.\nCoordinate BMS interfaces and do not change live configuration without authorisation and backup.",
    "L2": 1,
    "S2": 3,
    "resp": "ELV / BMS Engineer / Supervisor"
  },
  {
    "activity": "Installation of lighting, small power, emergency lighting and accessories",
    "hazards": "Electric shock; falling from access equipment; dropped fittings; incorrect circuit isolation",
    "persons": "Electricians, persons below, occupants",
    "L": 3,
    "S": 4,
    "controls": "Isolate and lock out the relevant circuit; verify dead before work.\nUse inspected access equipment, secure fittings and tools, maintain barriers below and confirm circuit schedules.\nEmergency lighting and life-safety circuits must only be isolated with authorised approval and reinstated/tested promptly.",
    "L2": 1,
    "S2": 4,
    "resp": "Electrical Engineer / Supervisor"
  },
  {
    "activity": "Hot work: welding, brazing, soldering, grinding and flame cutting",
    "hazards": "Fire, burns, fumes, eye injury, gas-cylinder failure, ignition of concealed combustibles",
    "persons": "Operators, nearby workers, building occupants",
    "L": 4,
    "S": 4,
    "controls": "Obtain hot-work permit; remove/protect combustibles and check concealed spaces.\nProvide suitable fire extinguisher, fire watch during work and post-work monitoring for the period required by site rules.\nInspect hoses, regulators and flashback arrestors; secure cylinders upright and away from heat.\nProvide ventilation and suitable welding PPE.",
    "L2": 2,
    "S2": 4,
    "resp": "Hot-Work Supervisor / HSE Officer"
  },
  {
    "activity": "Use of adhesives, solvents, insulation products, sealants and cleaning chemicals",
    "hazards": "Skin/eye irritation; inhalation; fire; chemical spills; incompatible chemical mixing",
    "persons": "Installers, cleaners, nearby workers",
    "L": 3,
    "S": 3,
    "controls": "Review current SDS and follow label instructions.\nSubstitute less hazardous products where practicable.\nEnsure ventilation, controlled storage and correct labelling; keep away from ignition sources.\nUse compatible gloves, eye protection and respiratory protection where required.\nDo not mix chemicals unless the procedure permits it; manage spills and waste safely.",
    "L2": 1,
    "S2": 3,
    "resp": "Supervisor / Storekeeper / HSE"
  },
  {
    "activity": "Thermal insulation, cladding, fire stopping and penetration sealing",
    "hazards": "Fibres/dust; cuts; working at height; incomplete fire compartmentation; concealed defects",
    "persons": "Insulators, installers, occupants, other trades",
    "L": 3,
    "S": 3,
    "controls": "Use approved materials and details; review SDS and use suitable gloves, eye and respiratory protection.\nMaintain safe access and control falling offcuts.\nSeal penetrations with approved fire-stopping systems matching the wall/floor rating, label where required and photograph/inspect before concealment.",
    "L2": 1,
    "S2": 3,
    "resp": "Discipline Engineer / Supervisor / QA/QC"
  },
  {
    "activity": "Testing of pipework, pressure systems and leak checks",
    "hazards": "Bursting hose/pipe; sudden release of stored energy; flying fittings; flooding; unauthorised access",
    "persons": "Testing team, other trades, occupants",
    "L": 4,
    "S": 5,
    "controls": "Use an approved test procedure and permit where required.\nVerify test boundaries, rated components, calibrated gauges, relief arrangements and secure temporary caps/blanks.\nExclude personnel from line of fire, raise pressure gradually and never tighten or repair under pressure.\nDepressurise safely before adjustment and record results.\nPneumatic testing requires a specific engineered procedure and approval.",
    "L2": 2,
    "S2": 5,
    "resp": "Discipline Engineer / Testing Supervisor / HSE"
  },
  {
    "activity": "Flushing, chemical cleaning, disinfection and water treatment",
    "hazards": "Chemical exposure; high flow/pressure; hose whip; discharge contamination; slips from spills",
    "persons": "Technicians, workers, environment",
    "L": 4,
    "S": 4,
    "controls": "Follow approved flushing/cleaning method and chemical supplier instructions.\nConfirm compatibility, SDS, PPE, ventilation, emergency eyewash and spill controls.\nSecure hoses, establish exclusion zones and control pressure/discharge.\nCollect and dispose of chemical effluent in accordance with project and authority requirements; do not discharge without approval.",
    "L2": 2,
    "S2": 4,
    "resp": "Commissioning Engineer / Specialist Contractor / HSE"
  },
  {
    "activity": "Condensate drainage testing, water filling and leak checks",
    "hazards": "Water leakage, ceiling damage, slips, contamination, hidden leaks after closure",
    "persons": "Installers, other trades, property users",
    "L": 3,
    "S": 3,
    "controls": "Verify correct slope, traps, supports and connections.\nConduct the specified drain test before insulation/closure, inspect all joints and confirm free discharge.\nProtect finishes and electrical equipment, contain and clean leaks immediately, document results and do not close ceilings until accepted.",
    "L2": 1,
    "S2": 3,
    "resp": "Mechanical Engineer / QA/QC / Supervisor"
  },
  {
    "activity": "Electrical testing, insulation resistance, continuity, polarity and energisation",
    "hazards": "Electric shock/arc flash; unexpected energisation; equipment damage; test-lead failure",
    "persons": "Authorised electricians, commissioning personnel",
    "L": 4,
    "S": 5,
    "controls": "Use approved test procedures and calibrated/inspected instruments.\nIsolate circuits and apply LOTO before testing where applicable; prove dead before touching conductors.\nOnly authorised personnel may energise.\nEstablish controlled boundaries, use correctly rated leads and PPE, notify affected personnel and reinstate covers/guards after testing.",
    "L2": 2,
    "S2": 5,
    "resp": "Authorised Electrical Person / Commissioning Engineer"
  },
  {
    "activity": "Testing and commissioning of HVAC, plumbing, fire protection and ELV/BMS systems",
    "hazards": "Unexpected start-up; moving parts; pressure/electrical hazards; alarms or systems operated without coordination",
    "persons": "Commissioning team, other trades, occupants",
    "L": 4,
    "S": 4,
    "controls": "Use approved commissioning plans, permits and competent specialists.\nNotify stakeholders before tests; verify mechanical completion, guards, isolations, valve positions and emergency stops.\nEstablish exclusion zones and communications.\nTest cause-and-effect and interfaces in a controlled sequence; record results and reinstate systems/alarms after each test.",
    "L2": 2,
    "S2": 4,
    "resp": "Commissioning Manager / Discipline Engineers / HSE"
  },
  {
    "activity": "Work in ceiling voids, risers, shafts, plant rooms and congested areas",
    "hazards": "Restricted access/egress; poor lighting/ventilation; sharp edges; dropped objects; interaction with multiple trades",
    "persons": "MEP workers, other trades",
    "L": 3,
    "S": 4,
    "controls": "Inspect access and egress, lighting, ventilation and housekeeping before entry.\nConfirm whether the area meets the project definition of a confined space; apply entry permit, atmospheric testing, attendant and rescue plan where required.\nCoordinate simultaneous operations and keep escape routes and access panels clear.",
    "L2": 1,
    "S2": 4,
    "resp": "Site Engineer / Supervisor / HSE"
  },
  {
    "activity": "Work in confined spaces or potentially hazardous enclosed areas (where applicable)",
    "hazards": "Oxygen deficiency; toxic/flammable atmosphere; engulfment; difficult rescue",
    "persons": "Entrants, attendants, rescuers",
    "L": 4,
    "S": 5,
    "controls": "Do not enter until assessed and authorised under a confined-space permit.\nIsolate connected services, test atmosphere before and during entry as specified, ventilate, maintain an attendant and reliable communications, and provide a task-specific rescue plan and suitable rescue equipment.\nNever attempt an unplanned rescue entry.",
    "L2": 2,
    "S2": 5,
    "resp": "Confined-Space Supervisor / HSE Officer"
  },
  {
    "activity": "Use of portable power tools and temporary electrical supplies",
    "hazards": "Electric shock; damaged leads; rotating parts; noise, vibration, dust and fire",
    "persons": "Tool users, nearby workers",
    "L": 3,
    "S": 4,
    "controls": "Use inspected tools with guards and suitable voltage/RCD protection as required by site rules.\nInspect leads, plugs and accessories before use; remove defective equipment from service.\nKeep cables out of water and walkways, secure workpieces and use correct PPE.\nDo not bypass guards or use tools for unintended purposes.",
    "L2": 1,
    "S2": 4,
    "resp": "Supervisor / Tool Users / HSE"
  },
  {
    "activity": "Use of mobile plant, forklifts, hoists and lifting equipment",
    "hazards": "Collision; overturning; dropped loads; crushing; equipment failure",
    "persons": "Operators, banksmen, workers, visitors",
    "L": 4,
    "S": 5,
    "controls": "Use trained authorised operators and inspected/certified equipment.\nPlan lifts and movements, verify SWL and ground conditions, use a banksman where required, segregate pedestrians and establish exclusion zones.\nNever stand under suspended loads or exceed capacity; stop operation if visibility, weather or communications are unsafe.",
    "L2": 2,
    "S2": 5,
    "resp": "Lifting Supervisor / Logistics / HSE"
  },
  {
    "activity": "Work adjacent to live services, occupied areas and simultaneous operations",
    "hazards": "Electric shock, flooding, gas release, fire-system impairment, nuisance alarms, injury to occupants",
    "persons": "MEP team, other contractors, occupants",
    "L": 4,
    "S": 4,
    "controls": "Identify and verify services from drawings and physical checks.\nObtain isolation/impairment approval and apply LOTO where applicable.\nNotify affected parties, provide temporary protection/barriers and maintain emergency routes.\nUse a permit and an agreed interface plan for tie-ins, shutdowns and disruptive tests.",
    "L2": 2,
    "S2": 4,
    "resp": "Project Manager / Site Engineer / HSE"
  },
  {
    "activity": "Inspection, snagging, protection and ceiling/wall closure",
    "hazards": "Hidden defects; damage to completed work; falling debris; blocked access to valves/dampers/junction boxes; premature closure",
    "persons": "Installers, QA/QC, other trades, occupants",
    "L": 3,
    "S": 3,
    "controls": "Complete required inspections, testing and photographic records before concealment.\nObtain relevant consultant/client clearance and confirm access panels, fire stopping, identification and maintenance clearances.\nProtect completed work, remove waste and do not close ceilings/walls until required approvals are documented.",
    "L2": 1,
    "S2": 3,
    "resp": "Site Engineer / QA/QC Engineer / Supervisor"
  },
  {
    "activity": "Housekeeping, waste segregation and end-of-shift handover",
    "hazards": "Trips, cuts, fire load, blocked escape routes, environmental contamination",
    "persons": "All site personnel",
    "L": 3,
    "S": 3,
    "controls": "Maintain housekeeping throughout the shift.\nRemove offcuts, cable ties, packaging and sharp waste to designated bins; segregate waste as required.\nStore chemicals and cylinders safely, clean spills, secure tools/materials and keep exits, fire points and electrical panels unobstructed.",
    "L2": 1,
    "S2": 3,
    "resp": "All Supervisors / Workers"
  },
  {
    "activity": "Environmental controls for MEP works",
    "hazards": "Dust/noise; uncontrolled discharge; spills; improper disposal of chemicals, oils, insulation and electronic waste",
    "persons": "Workers, public, environment",
    "L": 3,
    "S": 3,
    "controls": "Apply project environmental plan.\nControl dust and noise, protect drains, use spill kits, store liquids in suitable labelled/contained areas and segregate waste.\nDispose of hazardous and electronic waste through approved channels and keep records where required.",
    "L2": 1,
    "S2": 3,
    "resp": "Site Engineer / HSE / All Supervisors"
  },
  {
    "activity": "Outdoor and non-air-conditioned work in hot weather (heat stress)",
    "hazards": "Heat exhaustion; heat stroke; dehydration; fatigue leading to errors and accidents",
    "persons": "All site personnel",
    "L": 4,
    "S": 4,
    "controls": "Follow the Main Contractor Heat Stress Management Plan; midday break from 12:30 to 15:00 between 15 June and 15 September (MoHRE, as announced for the year).\nShaded, cooled rest areas with cool drinking water and electrolytes close to the work.\nMonitor the heat index / WBGT; adjust work-rest cycles and plan heavy work for the cooler hours.\nAcclimatise new workers; buddy system; train all workers in the signs of heat illness.\nFirst aider on site; stop work and give first aid at the first signs of heat illness.",
    "L2": 2,
    "S2": 4,
    "resp": "Project HSE Manager / Supervisors / First Aider"
  },
  {
    "activity": "Emergency response: injury, fire, fall, lifting incident, electric shock or chemical spill",
    "hazards": "Delayed response; worsening injury; unsafe rescue; secondary incident",
    "persons": "All personnel and responders",
    "L": 4,
    "S": 5,
    "controls": "Brief workers on alarms, emergency contacts, assembly point and reporting route.\nMaintain first aid, fire-fighting and spill-response equipment as applicable.\nKeep emergency access clear.\nStop work, raise alarm and isolate hazards only if safe.\nUse trained responders; do not move seriously injured persons unless exposed to immediate danger.\nFollow the site emergency and rescue plan and report incidents/near misses.",
    "L2": 2,
    "S2": 5,
    "resp": "Project Manager / HSE Officer / First Aider / All Supervisors"
  }
];

/** Environmental Impact Register rows for MEP works (Section 8.29 of the plan, RA master step 31 and the plan's legislation). */
export const ENV_ROWS: EnvRow[] = [
  {
    activity: 'Site offices, stores and welfare areas',
    aspect: 'General and food waste',
    impact: 'Land contamination, pests and odour; use of landfill space',
    cond: 'N', L: 5, S: 2,
    controls: 'Segregated, covered bins for general, recyclable and food waste.\nWaste removed regularly by the Main Contractor’s approved waste contractor.\nNo burning or burying of waste on site.\nWeekly housekeeping inspection.',
    legal: 'Federal Law No. 12 of 2018 (Integrated Waste Management); Main Contractor Waste Management Plan',
    resp: 'Site Engineer / Storekeeper / HSE Officer',
  },
  {
    activity: 'Installation of ductwork, pipework, containment and cabling',
    aspect: 'Offcuts and scrap (metal, cable, pipe, duct, insulation) and packaging',
    impact: 'Use of landfill space; loss of recyclable material',
    cond: 'N', L: 5, S: 2,
    controls: 'Order materials to measured quantities to keep offcuts down.\nSegregate metal, cable and packaging for recycling; return scrap copper and cable to the store.\nClear offcuts from work areas into the designated skips at the end of each shift.\nRemove packaging where materials are unpacked.',
    legal: 'Federal Law No. 12 of 2018; SWP 003 Environmental Management; Main Contractor Waste Management Plan',
    resp: 'Supervisors / Storekeeper',
  },
  {
    activity: 'Use of paints, adhesives, solvents, pipe cements, sealants and cleaning agents',
    aspect: 'Hazardous waste: empty or part-empty containers, rags, brushes and residues',
    impact: 'Soil and water contamination; harm to people and wildlife',
    cond: 'N', L: 4, S: 3,
    controls: 'Only small containers (typically 1 litre) issued to site.\nMSDS at the work area and COSHH assessment before use.\nUsed containers and contaminated rags placed in the Main Contractor’s labelled hazardous waste skip.\nHazardous waste removed by a licensed contractor; waste records kept.',
    legal: 'Federal Law No. 24 of 1999 and its regulation for handling hazardous materials and wastes; SWP 015 COSHH',
    resp: 'Supervisor / Storekeeper / HSE Officer',
  },
  {
    activity: 'Storage and use of chemicals, oils and lubricants (threading oil, cutting fluid, compressor oil)',
    aspect: 'Spills and leaks of oils and chemicals',
    impact: 'Soil and groundwater contamination',
    cond: 'A', L: 3, S: 3,
    controls: 'No oil, diesel or petrol stored on site.\nChemicals kept in a ventilated store on drip trays or bunds (110% of the largest container).\nSpill kits at the store and work areas; workers trained in spill response.\nSpills contained, cleaned up and reported to the HSE Officer; contaminated material disposed of as hazardous waste.',
    legal: 'Federal Law No. 24 of 1999; SWP 015 COSHH; SWP 003 Environmental Management',
    resp: 'Storekeeper / Supervisor / HSE Officer',
  },
  {
    activity: 'Flushing, chemical cleaning, disinfection and water treatment of pipework systems',
    aspect: 'Discharge of contaminated flushing and treatment water',
    impact: 'Pollution of drains, sewers and soil',
    cond: 'A', L: 3, S: 4,
    controls: 'Method statement for flushing and chemical cleaning approved before work.\nContaminated water not released into the drainage system: collected, stored and removed by a licensed contractor to an approved facility.\nWater tested or neutralised where required; Main Contractor approval before any discharge.\nChemicals handled as per MSDS; spill kit at the work area.',
    legal: 'Federal Law No. 24 of 1999; local authority drainage requirements; Main Contractor Environmental Management Plan',
    resp: 'Commissioning Engineer / Specialist Contractor / HSE Officer',
  },
  {
    activity: 'Pressure testing, water filling and condensate drain testing',
    aspect: 'Use and discharge of test water; leaks',
    impact: 'Water wastage; flooding and damage to finishes',
    cond: 'N', L: 3, S: 2,
    controls: 'Plan test sections so test water can be reused where practicable.\nDrain test water only to a drainage point approved by the Main Contractor.\nCheck joints before filling; buckets and absorbent pads at the test area.',
    legal: 'Main Contractor Environmental Management Plan; local authority drainage requirements',
    resp: 'Discipline Engineer / Testing Supervisor',
  },
  {
    activity: 'Installation, charging and testing of refrigerant systems (VRF, split units, chillers)',
    aspect: 'Release of refrigerant gases to air',
    impact: 'Ozone depletion and global warming',
    cond: 'A', L: 2, S: 4,
    controls: 'Refrigerant handled only by trained, certified technicians.\nPressure and leak test with dry nitrogen before charging.\nRecover refrigerant into approved cylinders with a recovery machine; never vent to air.\nRecord the refrigerant charged and recovered.',
    legal: 'Montreal Protocol and UAE controls on ozone-depleting substances; Federal Law No. 24 of 1999',
    resp: 'Mechanical Engineer / HVAC Supervisor',
  },
  {
    activity: 'Drilling, chasing, coring, cutting and grinding',
    aspect: 'Dust and particles',
    impact: 'Air pollution; nuisance to other trades and occupants; health effects',
    cond: 'N', L: 4, S: 2,
    controls: 'Use tools with dust extraction or water suppression.\nCut materials in designated areas; screens where needed.\nClean up with vacuum or damp methods; no dry sweeping or blowing with compressed air.\nRespiratory protection as per the risk assessment.',
    legal: 'Federal Law No. 24 of 1999 (air quality); SWP 003 Environmental Management',
    resp: 'Supervisor / HSE Officer',
  },
  {
    activity: 'Use of power tools, compressors, generators and mobile plant',
    aspect: 'Noise and vibration',
    impact: 'Nuisance to neighbours and occupants; hearing damage',
    cond: 'N', L: 4, S: 2,
    controls: 'Plan noisy work within the permitted working hours and the Main Contractor’s restrictions.\nUse well-maintained, low-noise equipment; switch off when not in use.\nHearing protection above 85 dB(A); noise assessments as needed.',
    legal: 'Federal Law No. 24 of 1999 (noise); HSES 017 Noise Control',
    resp: 'Supervisor / HSE Officer',
  },
  {
    activity: 'Hot work: welding, brazing, soldering and cutting',
    aspect: 'Welding fumes, gases and spatter',
    impact: 'Air pollution; fire risk',
    cond: 'N', L: 3, S: 2,
    controls: 'Hot work permit; fire watch and extinguisher at the work area.\nLocal exhaust ventilation in enclosed areas.\nCombustible materials removed or covered.\nGas cylinders stored upright, secured and capped.',
    legal: 'HSES 007 Hot Works; SWP 010 Fire Safety',
    resp: 'Hot-Work Supervisor / HSE Officer',
  },
  {
    activity: 'Vehicles, deliveries, generators and mobile plant',
    aspect: 'Exhaust emissions and fuel use',
    impact: 'Air pollution; use of natural resources',
    cond: 'N', L: 4, S: 1,
    controls: 'No idling: engines switched off when waiting.\nPlant and vehicles maintained and inspected.\nDeliveries planned to keep trips down; site power used instead of generators where available.',
    legal: 'Federal Law No. 24 of 1999 (air quality); SWP 017 Mobile Plant & Vehicles',
    resp: 'Logistics Coordinator / Supervisor',
  },
  {
    activity: 'Temporary lighting, power, air-conditioning and site offices',
    aspect: 'Electricity consumption',
    impact: 'Use of natural resources; emissions from power generation',
    cond: 'N', L: 5, S: 1,
    controls: 'Switch off lights, tools, air-conditioning and equipment when not in use.\nLED temporary lighting and energy-efficient equipment.\nRegular checks of temporary installations.',
    legal: 'Sustainability Policy Statement; SWP 003 Environmental Management',
    resp: 'Site Engineer / All Supervisors',
  },
  {
    activity: 'Water use for testing, cleaning, welfare and dust suppression',
    aspect: 'Water consumption',
    impact: 'Use of natural resources',
    cond: 'N', L: 4, S: 1,
    controls: 'Repair leaking taps, hoses and temporary pipes promptly.\nReuse test water where practicable.\nNo hosing down of floors; buckets, mops and vacuums instead.\nWater saving covered at toolbox talks.',
    legal: 'Sustainability Policy Statement; SWP 003 Environmental Management',
    resp: 'All Supervisors',
  },
  {
    activity: 'Installation of thermal and acoustic insulation (mineral wool, glass wool, rubber foam)',
    aspect: 'Insulation fibres and offcuts',
    impact: 'Air pollution; skin and respiratory irritation; landfill',
    cond: 'N', L: 3, S: 2,
    controls: 'Cut insulation in designated areas; bag offcuts straight away.\nDispose of as per MSDS through the Main Contractor’s waste system.\nGloves, long sleeves, eye protection and FFP2 masks.',
    legal: 'SWP 015 COSHH; Main Contractor Waste Management Plan',
    resp: 'Insulation Supervisor / HSE Officer',
  },
  {
    activity: 'Electrical works: cables, lamps, batteries and electronic devices',
    aspect: 'Electrical and electronic waste (lamps, batteries, damaged devices, cable drums)',
    impact: 'Soil and water contamination with heavy metals',
    cond: 'N', L: 3, S: 3,
    controls: 'Lamps, batteries and e-waste kept apart in labelled containers.\nCable drums returned to suppliers; copper offcuts recycled.\nLamps and batteries disposed of through an approved recycler.',
    legal: 'Federal Law No. 12 of 2018; Federal Law No. 24 of 1999 (hazardous wastes)',
    resp: 'Electrical Engineer / Storekeeper',
  },
  {
    activity: 'Work near drain gullies, roofs, open ground and landscaped areas',
    aspect: 'Materials, slurry, debris or water entering storm drains',
    impact: 'Pollution of storm water and the sea',
    cond: 'A', L: 3, S: 3,
    controls: 'Drain gullies near the work covered or protected.\nNo washing of tools, paint or cement into drains; designated washout area.\nLight materials and packaging secured against wind.',
    legal: 'Federal Law No. 24 of 1999; local authority drainage requirements; Main Contractor Environmental Management Plan',
    resp: 'Supervisor / HSE Officer',
  },
  {
    activity: 'Fire or explosion on site (hot work, electrical faults, flammable materials, LPG)',
    aspect: 'Smoke, fire-fighting water and burnt materials',
    impact: 'Air pollution; contaminated run-off; waste',
    cond: 'E', L: 2, S: 4,
    controls: 'Hot work and electrical permits; flammable materials stored away from ignition sources.\nFire extinguishers at work areas; fire marshals and emergency drills.\nFire-fighting run-off contained where possible; debris cleaned up and disposed of as hazardous waste.',
    legal: 'Civil Defence requirements; SWP 010 Fire Safety; SWP 019 Emergency Management',
    resp: 'Project Manager / HSE Officer / Fire Marshals',
  },
];

export const riskRows = (): RiskRow[] => RISK_ROWS.map((r) => ({ ...r }));
export const envRows = (): EnvRow[] => ENV_ROWS.map((r) => ({ ...r }));
