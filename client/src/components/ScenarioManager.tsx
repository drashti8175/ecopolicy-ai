import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Trash2, Save, BarChart3 } from "lucide-react";

export interface Scenario {
  id: string;
  name: string;
  city: string;
  levers: {
    ev_adoption_pct: number;
    solar_adoption_pct: number;
    trees_planted_pct: number;
    plastic_recycling_pct: number;
    public_transport_usage_pct: number;
  };
  results: {
    co2_emissions: number;
    aqi: number;
    electricity_demand: number;
    green_score: number;
  };
  timestamp: number;
}

interface ScenarioManagerProps {
  scenarios: Scenario[];
  onSaveScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
  onCompareScenarios: (ids: string[]) => void;
  currentCity: string;
  currentLevers: Record<string, number>;
  currentResults?: Record<string, number>;
}

export function ScenarioManager({
  scenarios,
  onSaveScenario,
  onDeleteScenario,
  onCompareScenarios,
  currentCity,
  currentLevers,
  currentResults,
}: ScenarioManagerProps) {
  const [scenarioName, setScenarioName] = useState("");
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!scenarioName.trim() || !currentResults) return;

    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      name: scenarioName,
      city: currentCity,
      levers: currentLevers as any,
      results: {
        co2_emissions: currentResults.co2_emissions || 0,
        aqi: currentResults.aqi || 0,
        electricity_demand: currentResults.electricity_demand || 0,
        green_score: currentResults.green_score || 0,
      },
      timestamp: Date.now(),
    };

    onSaveScenario(newScenario);
    setScenarioName("");
    setIsOpen(false);
  };

  const handleToggleScenario = (id: string) => {
    setSelectedScenarios((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleCompare = () => {
    if (selectedScenarios.length >= 2) {
      onCompareScenarios(selectedScenarios);
      setSelectedScenarios([]);
    }
  };

  const cityScenariosCount = scenarios.filter((s) => s.city === currentCity).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Scenario Manager
        </CardTitle>
        <CardDescription>Save and compare policy scenarios</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save New Scenario */}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" variant="outline" disabled={!currentResults}>
              <Save className="mr-2 h-4 w-4" />
              Save Current Scenario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Scenario</DialogTitle>
              <DialogDescription>Give this policy scenario a name for future reference.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="e.g., 'Green Delhi 2030'"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
              />
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!scenarioName.trim()}>
                  Save Scenario
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Saved Scenarios */}
        {cityScenariosCount > 0 ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Saved Scenarios ({cityScenariosCount})</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {scenarios
                .filter((s) => s.city === currentCity)
                .sort((a, b) => b.timestamp - a.timestamp)
                .map((scenario) => (
                  <div key={scenario.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.includes(scenario.id)}
                        onChange={() => handleToggleScenario(scenario.id)}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{scenario.name}</p>
                        <p className="text-xs text-slate-500">
                          Green Score: {scenario.results.green_score.toFixed(1)}/100
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteScenario(scenario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
            </div>

            {/* Compare Button */}
            {selectedScenarios.length >= 2 && (
              <Button onClick={handleCompare} className="w-full bg-blue-600 hover:bg-blue-700">
                Compare {selectedScenarios.length} Scenarios
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500">No saved scenarios for {currentCity}</p>
            <p className="text-xs text-slate-400 mt-1">Save your first scenario to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
