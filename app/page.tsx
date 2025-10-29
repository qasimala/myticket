import EventList from "./components/EventList";
import Header from "./components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <EventList />
      </div>
    </>
  );
}
