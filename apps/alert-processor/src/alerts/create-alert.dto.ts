import { IsString, IsNumber, IsISO8601 } from "class-validator";

export class CreateAlertDto {
  @IsString()
  city: string;

  @IsNumber()
  aqi: number;

  @IsString()
  category: string;

  @IsString()
  dominantPollutant: string;

  @IsISO8601()
  timestamp: string;
}
