import EventList from "./components/EventList";
import MainLayout from "./components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="p-6">
        <EventList />
      </div>
    </MainLayout>
  );
}
