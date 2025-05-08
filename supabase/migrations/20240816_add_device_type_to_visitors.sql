-- Add device_type column to visitors table if it doesn't exist already
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'visitors' AND column_name = 'device_type'
    ) THEN
        ALTER TABLE visitors ADD COLUMN device_type text;
        
        -- Add an index on device_type for faster querying
        CREATE INDEX IF NOT EXISTS idx_visitors_device_type ON public.visitors USING btree (device_type);
        
        -- Update existing records to have a default value
        UPDATE visitors 
        SET device_type = 
            CASE 
                WHEN user_agent ILIKE '%android%mobile%' OR user_agent ILIKE '%mobile%android%' 
                  OR user_agent ILIKE '%iphone%' OR user_agent ILIKE '%ipod%'
                  OR user_agent ILIKE '%blackberry%' OR user_agent ILIKE '%iemobile%'
                  OR user_agent ILIKE '%opera mini%' OR user_agent ILIKE '%samsung%mobile%'
                  OR user_agent ILIKE '%mobile%firefox%' OR user_agent ILIKE '%windows phone%' THEN 'mobile'
                
                WHEN user_agent ILIKE '%ipad%' OR (user_agent ILIKE '%android%' AND user_agent NOT ILIKE '%mobile%')
                  OR user_agent ILIKE '%tablet%' OR user_agent ILIKE '%kindle%'
                  OR user_agent ILIKE '%playbook%' OR user_agent ILIKE '%silk%'
                  OR user_agent ILIKE '%tablet%firefox%' THEN 'tablet'
                
                WHEN user_agent ILIKE '%tv%' OR user_agent ILIKE '%appletv%'
                  OR user_agent ILIKE '%tvos%' OR user_agent ILIKE '%webos%'
                  OR user_agent ILIKE '%netcast%' OR user_agent ILIKE '%tizen%'
                  OR user_agent ILIKE '%roku%' OR user_agent ILIKE '%vizio%'
                  OR user_agent ILIKE '%chromecast%' THEN 'smart-tv'
                
                WHEN user_agent ILIKE '%playstation%' OR user_agent ILIKE '%xbox%'
                  OR user_agent ILIKE '%nintendo%' THEN 'game-console'
                
                ELSE 'desktop'
            END
        WHERE user_agent IS NOT NULL;
    END IF;
END $$; 