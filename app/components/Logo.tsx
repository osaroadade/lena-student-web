import { Link } from "react-router"

export function Logo() {
    return (
        <div>
            <Link
                to={"/"}
                className="flex items-center gap-1.5"
            >
                <img src="/assets/lena-logo.svg" alt="lena: student logo" width={24} height={24} />
                <div className="text-xl font-semibold leading-5">lena: <span className="font-normal opacity-60">student</span></div>
            </Link>
        </div>
    )
}