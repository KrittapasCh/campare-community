-- ตารางพักสำหรับ import CSV — คอลัมน์ text ทั้งหมด ชื่อตรงกับหัว CSV เป๊ะ
-- (ชื่อมีเว้นวรรคและจุด เลยต้องครอบด้วย double quote)

drop table if exists camera_import;

create table camera_import (
  "Brand" text,
  "Model" text,
  "Year" text,
  "image_file" text,
  "Total megapixels" text,
  "Exposure Compensation" text,
  "Normal focus range" text,
  "Battery" text,
  "Sensor resolution" text,
  "Crop factor" text,
  "Sensor type" text,
  "Dimensions" text,
  "Max aperture" text,
  "Min. shutter speed" text,
  "White balance presets" text,
  "Macro focus range" text,
  "Optical zoom" text,
  "USB" text,
  "Weight" text,
  "Max. aperture (35mm equiv.)" text,
  "Focal length (35mm equiv.)" text,
  "Also known as" text,
  "Aperture priority" text,
  "Max. image resolution" text,
  "Max. shutter speed" text,
  "Storage types" text,
  "Effective megapixels" text,
  "Megapixels" text,
  "Max. video resolution" text,
  "Screen size" text,
  "Metering" text,
  "Digital zoom" text,
  "Shutter priority" text,
  "Sensor size" text,
  "Viewfinder" text,
  "Screen resolution" text,
  "ISO" text
);
