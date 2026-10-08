export type VaultRiskLevel='calm'|'watch'|'danger'|'extreme'|'madness';

export type VaultRiskPresentation={
 risk:number;
 level:VaultRiskLevel;
 label:string;
 code:string;
 title:string;
};

const STATES:Record<VaultRiskLevel,Omit<VaultRiskPresentation,'risk'|'level'>>={
 calm:{label:'안정',code:'LOW',title:'어느 봉인을 풀 것인가?'},
 watch:{label:'경계',code:'WATCH',title:'금고의 공기가 무거워진다'},
 danger:{label:'위험',code:'DANGER',title:'금고가 피를 요구한다'},
 extreme:{label:'치명적',code:'CRITICAL',title:'악마가 바로 곁에 있다'},
 madness:{label:'광기',code:'MADNESS',title:'금고가 이성을 삼켰다'}
};

export function vaultRiskPresentation(input:number):VaultRiskPresentation{
 const risk=Number.isFinite(input)?Math.max(0,Math.min(100,input)):0;
 const level:VaultRiskLevel=risk>=75?'madness':risk>=45?'extreme':risk>=30?'danger':risk>=15?'watch':'calm';
 return{risk,level,...STATES[level]};
}
