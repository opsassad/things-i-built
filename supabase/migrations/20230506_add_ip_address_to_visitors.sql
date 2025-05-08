-- Add IP address column to visitors table if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'visitors' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE visitors ADD COLUMN ip_address text;
    END IF;
END $$; 