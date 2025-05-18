import { CgSpinner } from "react-icons/cg";

const Spinner = () => {
  return (
    <div className="flex justify-center items-center py-10">
      <CgSpinner fontSize={24} className="w-12 h-12 animate-spin text-primary " />
    </div>
  );
};

export default Spinner; 