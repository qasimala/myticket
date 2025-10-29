import EventList from "./components/EventList";
import MainLayout from "./components/MainLayout";

export default function Home() {
  return (
    <MainLayout>
      <div className="p-6 lg:p-8">
        <EventList />
      </div>
    </MainLayout>
  );
}
