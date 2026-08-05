import { validateQualifications } from "./qualification-engine.js";
import { analyzeAppointment } from "./appointment-engine.js";
import { analyzePromotion } from "./promotion-engine.js";
import { analyzeTransfer } from "./transfer-engine.js";
import { analyzeDiscipline } from "./discipline-engine.js";
import { analyzeSalary } from "./salary-engine.js";
import { analyzePositionAllowance } from "./allowance-engine.js";
import { analyzeWorkforce } from "./workforce-engine.js";
import { analyzeRetirement } from "./retirement-engine.js";
import { analyzeHR } from "./hr-engine.js";
export function runHRWorkflow(input, crossModule = {}) {
  const qualification = validateQualifications(input.candidate, input.position);
  const appointment = analyzeAppointment(input, qualification); const promotion = analyzePromotion(input, qualification);
  const transfer = analyzeTransfer(input); const discipline = analyzeDiscipline(input); const salary = analyzeSalary(input);
  const allowance = analyzePositionAllowance(input); const workforce = analyzeWorkforce(input); const retirement = analyzeRetirement(input);
  const analyses = { appointment, promotion, transfer, discipline, salary, allowance, workforce, qualification, retirement };
  const hr = analyzeHR(input, analyses, crossModule);
  return { template: input.template, ...analyses, hr };
}
