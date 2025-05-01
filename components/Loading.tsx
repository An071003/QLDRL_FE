import ClipLoader from "react-spinners/ClipLoader";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-96">
      <ClipLoader size={50} color="#4F46E5" />
      <p className="mt-4 text-lg text-gray-600">Đang tải dữ liệu...</p>
    </div>
  );
}
