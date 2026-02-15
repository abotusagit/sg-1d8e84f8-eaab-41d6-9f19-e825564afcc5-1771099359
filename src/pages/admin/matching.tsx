import { useState, useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TestTube, Search, Heart, ArrowRight } from "lucide-react";
import { searchUsers, createTestMatch } from "@/services/adminService";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function TestMatchingPage() {
  const { admin, isLoading: authLoading } = useAdminAuth();
  const { toast } = useToast();
  
  const [user1Search, setUser1Search] = useState("");
  const [user2Search, setUser2Search] = useState("");
  const [user1Results, setUser1Results] = useState<any[]>([]);
  const [user2Results, setUser2Results] = useState<any[]>([]);
  const [selectedUser1, setSelectedUser1] = useState<any>(null);
  const [selectedUser2, setSelectedUser2] = useState<any>(null);
  const [isMatching, setIsMatching] = useState(false);

  const handleSearch = async (query: string, setResults: (data: any[]) => void) => {
    if (!query) return;
    const { data } = await searchUsers({ username: query });
    setResults(data || []);
  };

  const handleMatch = async () => {
    if (!selectedUser1 || !selectedUser2) return;
    
    setIsMatching(true);
    try {
      const { error } = await createTestMatch(selectedUser1.id, selectedUser2.id, admin!.id);
      
      if (error) throw error;
      
      toast({
        title: "Match Created",
        description: `Successfully matched ${selectedUser1.username} with ${selectedUser2.username}`,
      });
      
      // Reset
      setSelectedUser1(null);
      setSelectedUser2(null);
      setUser1Search("");
      setUser2Search("");
    } catch (error) {
      toast({
        title: "Matching Failed",
        description: "Could not create test match. Users might already be matched.",
        variant: "destructive",
      });
    } finally {
      setIsMatching(false);
    }
  };

  if (authLoading || !admin) return null;

  const UserCard = ({ user, onClear }: { user: any, onClear: () => void }) => (
    <div className="border rounded-lg p-4 bg-slate-50 relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute top-2 right-2 h-6 w-6 p-0" 
        onClick={onClear}
      >
        ×
      </Button>
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar_url} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{user.username}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
          <div className="flex gap-2 mt-1">
            <span className="text-xs bg-white border px-1 rounded">{user.gender}</span>
            <span className="text-xs bg-white border px-1 rounded">{user.age || '?'} yo</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <SEO title="Test Matching - Marriagepal Admin" />
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Test Matching</h2>
            <p className="text-slate-600">Manually match users for testing purposes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            {/* User 1 Selection */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>User A</CardTitle>
                <CardDescription>Select first user to match</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser1 ? (
                  <UserCard user={selectedUser1} onClear={() => setSelectedUser1(null)} />
                ) : (
                  <div className="space-y-2">
                    <Label>Search User</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Username..." 
                        value={user1Search}
                        onChange={(e) => setUser1Search(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(user1Search, setUser1Results)}
                      />
                      <Button size="icon" onClick={() => handleSearch(user1Search, setUser1Results)}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {user1Results.length > 0 && (
                      <div className="border rounded-md mt-2 max-h-[300px] overflow-y-auto divide-y">
                        {user1Results.map(user => (
                          <button
                            key={user.id}
                            className="w-full text-left p-2 hover:bg-slate-50 text-sm flex items-center justify-between"
                            onClick={() => {
                              setSelectedUser1(user);
                              setUser1Results([]);
                            }}
                          >
                            <span>{user.username}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Match Action */}
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <div className="p-4 bg-pink-50 rounded-full">
                <Heart className={`w-8 h-8 text-pink-500 ${isMatching ? 'animate-pulse' : ''}`} />
              </div>
              <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 md:rotate-0" />
              <Button 
                size="lg" 
                className="w-full md:w-auto bg-pink-600 hover:bg-pink-700"
                disabled={!selectedUser1 || !selectedUser2 || isMatching}
                onClick={handleMatch}
              >
                Create Match
              </Button>
            </div>

            {/* User 2 Selection */}
            <Card className="h-full">
              <CardHeader>
                <CardTitle>User B</CardTitle>
                <CardDescription>Select second user to match</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedUser2 ? (
                  <UserCard user={selectedUser2} onClear={() => setSelectedUser2(null)} />
                ) : (
                  <div className="space-y-2">
                    <Label>Search User</Label>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Username..." 
                        value={user2Search}
                        onChange={(e) => setUser2Search(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(user2Search, setUser2Results)}
                      />
                      <Button size="icon" onClick={() => handleSearch(user2Search, setUser2Results)}>
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                    
                    {user2Results.length > 0 && (
                      <div className="border rounded-md mt-2 max-h-[300px] overflow-y-auto divide-y">
                        {user2Results.map(user => (
                          <button
                            key={user.id}
                            className="w-full text-left p-2 hover:bg-slate-50 text-sm flex items-center justify-between"
                            onClick={() => {
                              setSelectedUser2(user);
                              setUser2Results([]);
                            }}
                          >
                            <span>{user.username}</span>
                            <span className="text-xs text-slate-400">{user.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    </>
  );
}