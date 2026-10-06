import type { SavingsCalculation,SavingsPlanInput,SavingsState } from "./types";
const MONTH_NUMERATOR=243495n,MONTH_DENOMINATOR=8000n;
const maxZero=(value:bigint)=>value<0n?0n:value;
export function ceilDivide(numerator:bigint,denominator:bigint):bigint{if(denominator<=0n)throw new Error("O divisor deve ser positivo.");return numerator===0n?0n:(numerator+denominator-1n)/denominator;}
export function calendarDaysBetween(from:string,to:string):number{const parts=(value:string)=>value.split("-").map(Number),[fy,fm,fd]=parts(from),[ty,tm,td]=parts(to);return Math.round((Date.UTC(ty,tm-1,td)-Date.UTC(fy,fm-1,fd))/86_400_000);}
export function formatProgress(basisPoints:bigint|null):string|null{if(basisPoints===null)return null;const whole=basisPoints/100n,fraction=(basisPoints%100n).toString().padStart(2,"0").replace(/0+$/,"");return fraction?`${whole},${fraction}%`:`${whole}%`;}
// Owner rule 2026-10-06: "Já temos" is the money the traveller holds for the trip, edited only by
// them. Paying expenses spends from it, so payments are reported (eligiblePaidMinor) but never added.
export function calculateSavingsPlan(input:SavingsPlanInput):SavingsCalculation{
 const targetBasis=input.targetBudgetMinor!==null?"target_budget":input.hasForecast?"current_forecast":null,targetMinor=input.targetBudgetMinor!==null?BigInt(input.targetBudgetMinor):input.hasForecast?BigInt(input.forecastMinor):null,currentAvailableMinor=BigInt(input.currentAvailableMinor),eligiblePaidMinor=maxZero(BigInt(input.netPaidMinor)),totalFundedMinor=currentAvailableMinor,daysUntilDeparture=calendarDaysBetween(input.today,input.startDate);
 if(targetMinor===null)return{state:"no_target",targetBasis:null,targetMinor:null,currentAvailableMinor,eligiblePaidMinor,totalFundedMinor,remainingMinor:null,surplusMinor:null,progressBasisPoints:null,daysUntilDeparture,dailyPaceMinor:null,weeklyPaceMinor:null,monthlyPaceMinor:null};
 const remainingMinor=maxZero(targetMinor-totalFundedMinor),surplusMinor=maxZero(totalFundedMinor-targetMinor),progressBasisPoints=targetMinor===0n?10000n:(totalFundedMinor*10000n/targetMinor>10000n?10000n:totalFundedMinor*10000n/targetMinor);
 let state:SavingsState;if(daysUntilDeparture<0)state="trip_started_or_past";else if(totalFundedMinor>targetMinor)state="overfunded";else if(remainingMinor===0n)state="fully_funded";else if(daysUntilDeparture===0)state="departure_today";else if(totalFundedMinor===0n)state="not_funded";else state="partially_funded";
 let dailyPaceMinor:bigint|null=null,weeklyPaceMinor:bigint|null=null,monthlyPaceMinor:bigint|null=null;if(remainingMinor===0n){dailyPaceMinor=0n;weeklyPaceMinor=0n;monthlyPaceMinor=0n;}else if(daysUntilDeparture>0){const days=BigInt(daysUntilDeparture);dailyPaceMinor=ceilDivide(remainingMinor,days);weeklyPaceMinor=ceilDivide(remainingMinor*7n,days);monthlyPaceMinor=ceilDivide(remainingMinor*MONTH_NUMERATOR,days*MONTH_DENOMINATOR);}
 return{state,targetBasis,targetMinor,currentAvailableMinor,eligiblePaidMinor,totalFundedMinor,remainingMinor,surplusMinor,progressBasisPoints,daysUntilDeparture,dailyPaceMinor,weeklyPaceMinor,monthlyPaceMinor};
}
