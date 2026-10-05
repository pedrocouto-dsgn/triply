import { z } from "zod";
import { IANA_TIMEZONES } from "@/features/route/timezones";
import type { ItineraryValues } from "./types";
const date=z.string().regex(/^\d{4}-\d{2}-\d{2}$/,"Selecione um dia válido."),time=z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/,"Introduza uma hora válida.");
export const idSchema=z.string().uuid();
export const itinerarySchema=z.object({tripDate:date,stopId:z.string(),title:z.string().trim().min(1,"Introduza um título.").max(120),placeName:z.string().trim().max(160).transform(v=>v||null),startTime:z.string(),endTime:z.string(),timezone:z.string(),notes:z.string().max(4000).transform(v=>v.trim()||null),requestId:idSchema}).superRefine((value,ctx)=>{
 if(value.stopId&&!idSchema.safeParse(value.stopId).success)ctx.addIssue({code:"custom",path:["stopId"],message:"Destino inválido."});
 if(value.startTime&&!time.safeParse(value.startTime).success)ctx.addIssue({code:"custom",path:["startTime"],message:"Hora inicial inválida."});
 if(value.endTime&&!value.startTime)ctx.addIssue({code:"custom",path:["endTime"],message:"A hora final exige uma hora inicial."});
 if(value.endTime&&!time.safeParse(value.endTime).success)ctx.addIssue({code:"custom",path:["endTime"],message:"Hora final inválida."});
 if(value.startTime&&value.endTime&&value.endTime<value.startTime)ctx.addIssue({code:"custom",path:["endTime"],message:"A hora final não pode ser anterior à inicial."});
 if(value.timezone&&!IANA_TIMEZONES.includes(value.timezone as (typeof IANA_TIMEZONES)[number]))ctx.addIssue({code:"custom",path:["timezone"],message:"Selecione um timezone válido ou deixe em branco."});
});
export function itineraryValues(data:FormData):ItineraryValues{return{tripDate:String(data.get("tripDate")??""),stopId:String(data.get("stopId")??""),title:String(data.get("title")??""),placeName:String(data.get("placeName")??""),startTime:String(data.get("startTime")??""),endTime:String(data.get("endTime")??""),timezone:String(data.get("timezone")??""),notes:String(data.get("notes")??""),requestId:String(data.get("requestId")??"")};}
