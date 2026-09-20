import { useCallback, useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  formatArtistDisplayName,
  getAvailableArtistsForBooking,
  type AvailableArtistForBooking,
} from "../../lib/db/available-artists";
import { listArtistsForServices } from "../../lib/db/booking-schedule";

type ArtistSelectionSectionProps = {
  districtId: string;
  serviceIds: string[];
  /** When omitted (browse mode), lists artists by district + services only. */
  date?: Date;
  time?: string;
  durationMinutes?: number;
  bufferMinutes?: number;
  excludeBookingId?: string;
  selectedArtistId: string;
  onSelect: (
    artistId: string,
    artist?: AvailableArtistForBooking,
  ) => void;
  onBack: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Override description under the title area. */
  description?: string;
  emptyMessage?: string;
};

export function ArtistSelectionSection({
  districtId,
  serviceIds,
  date,
  time,
  durationMinutes = 60,
  bufferMinutes = 30,
  excludeBookingId,
  selectedArtistId,
  onSelect,
  onBack,
  onContinue,
  continueLabel = "Continue",
  description,
  emptyMessage,
}: ArtistSelectionSectionProps) {
  const browseMode = !date || !time;
  const [artists, setArtists] = useState<
    AvailableArtistForBooking[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const loadArtists = useCallback(async () => {
    if (!districtId) {
      setArtists([]);
      return;
    }

    setIsLoading(true);
    setHasError(false);
    try {
      const result = browseMode
        ? await listArtistsForServices({
            districtId,
            serviceIds,
          })
        : await getAvailableArtistsForBooking({
            districtId,
            serviceIds,
            appointmentDate: date!,
            appointmentTime: time!,
            durationMinutes,
            bufferMinutes,
            excludeBookingId,
          });
      setArtists(result);
      if (
        selectedArtistId &&
        !result.some((a) => a.id === selectedArtistId)
      ) {
        onSelect("");
      }
    } catch {
      setHasError(true);
      setArtists([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    browseMode,
    districtId,
    serviceIds,
    date,
    time,
    durationMinutes,
    bufferMinutes,
    excludeBookingId,
    selectedArtistId,
    onSelect,
  ]);

  useEffect(() => {
    void loadArtists();
  }, [loadArtists]);

  const defaultDescription = browseMode
    ? "Choose an artist who can perform your selected services."
    : `Choose an artist for your appointment on ${date!.toLocaleDateString("en-GB")} at ${time}.`;

  const defaultEmpty = browseMode
    ? "No active artists support these services in your district."
    : "No artists are available for this district, service, and time. Try another time slot or date.";

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        {description ?? defaultDescription}
      </p>

      {!districtId ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Select a district before choosing an artist.
        </div>
      ) : isLoading ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
          Loading available artists…
        </div>
      ) : hasError ? (
        <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
          <p>Unable to load available artists.</p>
          <Button
            type="button"
            onClick={() => void loadArtists()}
            className="mx-auto"
          >
            Try again
          </Button>
        </div>
      ) : artists.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          {emptyMessage ?? defaultEmpty}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {artists.map((artist) => {
            const isSelected = selectedArtistId === artist.id;
            return (
              <Button
                key={artist.id}
                type="button"
                variant="outline"
                className={`h-auto py-4 px-4 flex flex-col items-start border-2 ${isSelected ? "" : ""}`}
                style={{
                  borderColor: isSelected
                    ? "#3D3935"
                    : "#DCD4CD",
                  backgroundColor: isSelected
                    ? "#E9CFCA"
                    : "#FEFCFA",
                  color: "#3D3935",
                }}
                onClick={() => onSelect(artist.id, artist)}
              >
                <span className="font-medium">
                  {formatArtistDisplayName(artist)}
                </span>
                <span className="text-xs opacity-70">
                  @{artist.username}
                </span>
              </Button>
            );
          })}
        </div>
      )}

      <div
        className="flex justify-between pt-4 border-t-2 gap-3"
        style={{ borderColor: "#DCD4CD" }}
      >
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-2 hover:bg-[#DCD4CD]"
          style={{ borderColor: "#3D3935", color: "#3D3935" }}
          onClick={onBack}
        >
          Back
        </Button>
        <Button
          type="button"
          disabled={!selectedArtistId}
          className="flex-1 border-2"
          style={{
            backgroundColor: selectedArtistId
              ? "#3D3935"
              : "#DCD4CD",
            borderColor: "#3D3935",
            color: selectedArtistId ? "#FEFCFA" : "#3D3935",
            cursor: selectedArtistId
              ? "pointer"
              : "not-allowed",
          }}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}
