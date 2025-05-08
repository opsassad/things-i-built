import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Ban, AlertTriangle, RefreshCw } from "lucide-react";

interface SuspiciousActivity {
  ip_address: string;
  count: number;
  reason: string;
}

export const RatingActivity = () => {
  const [suspiciousActivity, setSuspiciousActivity] = useState<SuspiciousActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSuspiciousActivity();
  }, []);

  const fetchSuspiciousActivity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get all ratings with timestamps
      const { data, error } = await supabase
        .from('ratings')
        .select(`
          id,
          post_id,
          rating,
          ip_address,
          created_at,
          blog_posts:post_id (title)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) {
        setSuspiciousActivity([]);
        setLoading(false);
        return;
      }
      
      // Process data to find suspicious patterns
      const ipCounts: Record<string, { count: number; timestamps: Date[] }> = {};
      
      data.forEach(rating => {
        if (!rating.ip_address) return;
        
        if (!ipCounts[rating.ip_address]) {
          ipCounts[rating.ip_address] = {
            count: 0,
            timestamps: []
          };
        }
        
        ipCounts[rating.ip_address].count++;
        ipCounts[rating.ip_address].timestamps.push(new Date(rating.created_at));
      });
      
      // Find IPs with many ratings or rapid ratings
      const suspicious: SuspiciousActivity[] = [];
      
      Object.keys(ipCounts).forEach(ip => {
        const info = ipCounts[ip];
        
        // Skip if too few ratings
        if (info.count < 3) return;
        
        // Sort timestamps in ascending order
        info.timestamps.sort((a, b) => a.getTime() - b.getTime());
        
        // Check for rapid ratings (less than 5 minutes apart)
        for (let i = 0; i < info.timestamps.length - 1; i++) {
          const timeDiff = (info.timestamps[i+1].getTime() - info.timestamps[i].getTime()) / 1000 / 60; // minutes
          
          if (timeDiff < 5) {
            suspicious.push({
              ip_address: ip,
              count: info.count,
              reason: `${info.count} ratings with some only ${timeDiff.toFixed(1)} minutes apart`
            });
            break;
          }
        }
        
        // Also flag IPs with unusually high number of ratings
        if (info.count > 20 && !suspicious.some(s => s.ip_address === ip)) {
          suspicious.push({
            ip_address: ip,
            count: info.count,
            reason: `High volume: ${info.count} ratings`
          });
        }
      });
      
      setSuspiciousActivity(suspicious);
    } catch (err: any) {
      console.error("Error fetching rating activity:", err);
      setError(err.message || "Failed to fetch rating data");
    } finally {
      setLoading(false);
    }
  };

  const blockIpAddress = async (ip: string) => {
    if (!confirm(`Are you sure you want to block IP address ${ip}? This will delete all ratings from this IP.`)) {
      return;
    }
    
    try {
      // Delete all ratings from this IP
      const { error } = await supabase
        .from('ratings')
        .delete()
        .eq('ip_address', ip);
      
      if (error) throw error;
      
      // Could also add this IP to a blocked_ips table for future prevention
      
      // Refresh the data
      fetchSuspiciousActivity();
      
      alert(`IP address ${ip} has been blocked and its ratings removed.`);
    } catch (err: any) {
      console.error("Error blocking IP:", err);
      alert(`Failed to block IP: ${err.message}`);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Rating Security Monitor
        </CardTitle>
        <CardDescription>
          Monitor suspicious rating activity and potential abuse
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {loading ? (
          <div className="py-8 text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Loading activity data...</p>
          </div>
        ) : suspiciousActivity.length > 0 ? (
          <div className="space-y-4">
            <h3 className="font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Suspicious Rating Activity Detected ({suspiciousActivity.length})
            </h3>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">IP Address</th>
                    <th className="text-left p-3">Rating Count</th>
                    <th className="text-left p-3">Reason</th>
                    <th className="text-left p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {suspiciousActivity.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-3">{item.ip_address}</td>
                      <td className="p-3">{item.count}</td>
                      <td className="p-3">{item.reason}</td>
                      <td className="p-3">
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="flex items-center gap-1"
                          onClick={() => blockIpAddress(item.ip_address)}
                        >
                          <Ban className="h-4 w-4" />
                          <span>Block</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-gray-500">No suspicious activity detected</p>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={fetchSuspiciousActivity}
            variant="outline"
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}; 