import { useState } from "react";
import { Send, CheckCircle, Loader } from "lucide-react";
import { createContactMessage } from "../../lib/db/contact-messages";
import { ContactMessageCreateSchema } from "../../schema/contact-message.schema";
import { ZodError } from "zod";

type FieldErrors = {
  name?: string;
  email?: string;
  message?: string;
};

export function Newsletter() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(
    null,
  );

  const validate = (): boolean => {
    try {
      ContactMessageCreateSchema.parse(form);
      setFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: FieldErrors = {};
        for (const issue of err.issues) {
          const field = issue.path[0] as keyof FieldErrors;
          if (!errors[field]) errors[field] = issue.message;
        }
        setFieldErrors(errors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await createContactMessage(form);
      setIsSuccess(true);
      setForm({ name: "", email: "", message: "" });
      setFieldErrors({});
    } catch {
      setSubmitError(
        "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-3 border-2 text-sm bg-white focus:outline-none transition-colors";

  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div
          className="border-2 p-8 md:p-12 lg:p-16"
          style={{
            borderColor: "#3D3935",
            background: "linear-gradient(105deg, #FCEAE0, #EACAB8)",
          }}
        >
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div
                className="w-16 h-16 flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "#3D3935" }}
              >
                <Send
                  className="w-7 h-7"
                  style={{ color: "#FCEAE0" }}
                />
              </div>
              <h2
                className="mb-3"
                style={{ color: "#3D3935" }}
              >
                Send a Note
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#5C5550" }}
              >
                Have a question or a special request? Leave us a
                message and we'll get back to you.
              </p>
            </div>

            {isSuccess ? (
              <div
                className="border-2 p-8 text-center"
                style={{
                  borderColor: "#3D3935",
                  backgroundColor: "#FEFCFA",
                }}
              >
                <CheckCircle
                  className="w-10 h-10 mx-auto mb-4"
                  style={{ color: "#3D3935" }}
                />
                <p
                  className="font-semibold mb-2"
                  style={{ color: "#3D3935" }}
                >
                  Message received!
                </p>
                <p
                  className="text-sm"
                  style={{ color: "#5C5550" }}
                >
                  We'll be in touch with you soon.
                </p>
                <button
                  type="button"
                  className="mt-6 text-sm underline underline-offset-2"
                  style={{ color: "#3D3935" }}
                  onClick={() => setIsSuccess(false)}
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                {/* Name + Email — side by side, each half the form width */}
                <div className="grid grid-cols-2 gap-5">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "#3D3935" }}
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                      }
                      className={inputClass}
                      style={{
                        borderColor: fieldErrors.name
                          ? "#C0392B"
                          : "#3D3935",
                      }}
                    />
                    {fieldErrors.name && (
                      <p className="text-xs mt-1 text-red-600">
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold uppercase tracking-widest mb-2"
                      style={{ color: "#3D3935" }}
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      className={inputClass}
                      style={{
                        borderColor: fieldErrors.email
                          ? "#C0392B"
                          : "#3D3935",
                      }}
                    />
                    {fieldErrors.email && (
                      <p className="text-xs mt-1 text-red-600">
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold uppercase tracking-widest mb-2"
                    style={{ color: "#3D3935" }}
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={(e) =>
                      setForm({ ...form, message: e.target.value })
                    }
                    className={inputClass}
                    style={{
                      borderColor: fieldErrors.message
                        ? "#C0392B"
                        : "#3D3935",
                      resize: "vertical",
                    }}
                  />
                  <div className="flex items-start justify-between mt-1">
                    {fieldErrors.message ? (
                      <p className="text-xs text-red-600">
                        {fieldErrors.message}
                      </p>
                    ) : (
                      <span />
                    )}
                    <p
                      className="text-xs"
                      style={{ color: "#9B8F89" }}
                    >
                      {form.message.length}/2000
                    </p>
                  </div>
                </div>

                {/* Server error */}
                {submitError && (
                  <p className="text-sm text-red-600 text-center">
                    {submitError}
                  </p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-3 px-8 py-4 border-2 font-semibold text-sm uppercase tracking-widest transition-opacity disabled:opacity-60"
                  style={{
                    backgroundColor: "#3D3935",
                    borderColor: "#3D3935",
                    color: "#FCEAE0",
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
