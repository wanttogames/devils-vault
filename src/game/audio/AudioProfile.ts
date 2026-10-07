export type VaultSoundRiskLevel='quiet'|'watch'|'danger'|'severe'|'critical';

export type VaultSoundProfile={
 risk:number;
 level:VaultSoundRiskLevel;
 droneGain:number;
 noiseGain:number;
 heartbeatMs:number;
 lowpassHz:number;
};

export function soundProfileForRisk(input:number):VaultSoundProfile{
 const risk=Number.isFinite(input)?Math.max(0,Math.min(100,input)):0;
 const level:VaultSoundRiskLevel=risk>=60?'critical':risk>=45?'severe':risk>=30?'danger':risk>=15?'watch':'quiet';
 const t=risk/100;
 return{risk,level,droneGain:.018+t*.038,noiseGain:.004+t*.018,heartbeatMs:Math.round(1500-t*900),lowpassHz:Math.round(180+t*520)};
}
