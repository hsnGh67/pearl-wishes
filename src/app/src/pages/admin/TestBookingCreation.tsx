import { useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { createBookingWithTreatments } from '../../lib/db';
import { BookingStatus } from '../../schema/booking.schema';
import { Plus, Trash2, CheckCircle, XCircle } from 'lucide-react';

/**
 * Test page for creating multi-person bookings
 * This is a development tool to test the booking-with-treatments functionality
 */
export default function TestBookingCreation() {
  const [customerName, setCustomerName] = useState('Sarah Johnson');
  const [customerEmail, setCustomerEmail] = useState('sarah@example.com');
  const [customerPhone, setCustomerPhone] = useState('+44 7700 900123');
  const [appointmentDate, setAppointmentDate] = useState('2026-03-15');
  const [appointmentTime, setAppointmentTime] = useState('14:00');
  
  const [treatments, setTreatments] = useState([
    { personName: 'Sarah Johnson', serviceName: 'Gel Manicure', price: 45, duration: 75 },
  ]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const addTreatment = () => {
    setTreatments([
      ...treatments,
      { personName: '', serviceName: '', price: 0, duration: 0 },
    ]);
  };

  const removeTreatment = (index: number) => {
    setTreatments(treatments.filter((_, i) => i !== index));
  };

  const updateTreatment = (index: number, field: string, value: any) => {
    const updated = [...treatments];
    updated[index] = { ...updated[index], [field]: value };
    setTreatments(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // Calculate totals
      const totalPrice = treatments.reduce((sum, t) => sum + Number(t.price), 0);
      const totalDuration = treatments.reduce((sum, t) => sum + Number(t.duration), 0);

      // Create booking with treatments
      const response = await createBookingWithTreatments({
        booking: {
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          appointment_date: appointmentDate,
          appointment_time: appointmentTime,
          service_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          service_name: `Multi-Person Booking (${treatments.length} ${treatments.length === 1 ? 'person' : 'people'})`,
          price: totalPrice,
          duration: totalDuration,
          status: BookingStatus.CONFIRMED,
          address: '123 Test Street, London',
          district: 'Hampstead',
          notes: 'Test booking created via admin tool',
        },
        treatments: treatments.map((t) => ({
          service_id: '00000000-0000-0000-0000-000000000000', // Placeholder
          person_name: t.personName,
          service_name: t.serviceName,
          price: Number(t.price),
          duration: Number(t.duration),
          status: 'active' as const,
        })),
      });

      setResult({
        success: true,
        message: `✅ Booking created! ID: ${response.booking.id}\nTreatments: ${response.treatmentsCreated}`,
      });

      // Reset form
      setTimeout(() => {
        setResult(null);
      }, 5000);
    } catch (error: any) {
      setResult({
        success: false,
        message: `❌ Error: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalPrice = treatments.reduce((sum, t) => sum + Number(t.price || 0), 0);
  const totalDuration = treatments.reduce((sum, t) => sum + Number(t.duration || 0), 0);

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Multi-Person Booking Creation</CardTitle>
          <p className="text-sm text-gray-600">
            Create test bookings with multiple treatments to verify the system works
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              
              <div>
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerEmail">Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="customerPhone">Phone</Label>
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointmentDate">Date</Label>
                  <Input
                    id="appointmentDate"
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => setAppointmentDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="appointmentTime">Time</Label>
                  <Input
                    id="appointmentTime"
                    type="time"
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Treatments */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Treatments ({treatments.length})</h3>
                <Button type="button" onClick={addTreatment} size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Person
                </Button>
              </div>

              {treatments.map((treatment, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Person {index + 1}</span>
                        {treatments.length > 1 && (
                          <Button
                            type="button"
                            onClick={() => removeTreatment(index)}
                            size="sm"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Person Name</Label>
                          <Input
                            value={treatment.personName}
                            onChange={(e) => updateTreatment(index, 'personName', e.target.value)}
                            placeholder="e.g., Sarah Johnson"
                            required
                          />
                        </div>

                        <div>
                          <Label>Service Name</Label>
                          <Input
                            value={treatment.serviceName}
                            onChange={(e) => updateTreatment(index, 'serviceName', e.target.value)}
                            placeholder="e.g., Gel Manicure"
                            required
                          />
                        </div>

                        <div>
                          <Label>Price (£)</Label>
                          <Input
                            type="number"
                            value={treatment.price}
                            onChange={(e) => updateTreatment(index, 'price', parseFloat(e.target.value))}
                            min="0"
                            step="0.01"
                            required
                          />
                        </div>

                        <div>
                          <Label>Duration (mins)</Label>
                          <Input
                            type="number"
                            value={treatment.duration}
                            onChange={(e) => updateTreatment(index, 'duration', parseInt(e.target.value))}
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="bg-gray-50">
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total People:</span>
                    <span className="font-semibold">{treatments.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Price:</span>
                    <span className="font-semibold">£{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Duration:</span>
                    <span className="font-semibold">
                      {totalDuration} mins ({Math.floor(totalDuration / 60)}h {totalDuration % 60}m)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Result Message */}
            {result && (
              <Card className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    )}
                    <pre className="text-sm whitespace-pre-wrap">{result.message}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Booking...' : 'Create Test Booking'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>1. Fill in the customer information</p>
          <p>2. Add treatments for each person (click "Add Person" for multiple people)</p>
          <p>3. Click "Create Test Booking"</p>
          <p>4. Go to Admin → Calendar to see your booking with treatments</p>
          <p>5. Click the booking to view all treatments and test cancellation</p>
        </CardContent>
      </Card>
    </div>
  );
}