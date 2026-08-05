export function analyzeVoting(input, quorum) {
  const yes = Number(input.voting.yes) || 0; const no = Number(input.voting.no) || 0; const abstain = Number(input.voting.abstain) || 0;
  const basis = input.voting.rule ?? "simple-majority";
  const threshold = basis === "two-thirds" ? Math.ceil(quorum.present * 2 / 3) : basis === "absolute-majority" ? Math.floor(input.totalMembers / 2) + 1 : Math.floor((yes + no) / 2) + 1;
  return { yes, no, abstain, votesCast: yes + no + abstain, rule: basis, threshold, passed: quorum.met && yes >= threshold, countValid: yes + no + abstain <= quorum.present };
}
