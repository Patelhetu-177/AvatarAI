import { useEffect, useState } from "react";
import { CldUploadButton, CloudinaryUploadWidgetResults, CloudinaryUploadWidgetInfo } from 'next-cloudinary';
import Image from "next/image";

interface ImageUploadProps {
    value: string;
    onChange: (src: string) => void;
    disabled?: boolean;
}

export const ImageUpload = ({
    value,
    onChange,
}: ImageUploadProps) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    const isCloudinaryUploadWidgetInfo = (info: unknown): info is CloudinaryUploadWidgetInfo => {
        return typeof info === 'object' && info !== null && 'secure_url' in info;
    };

    return (
        <div className="space-y-4 w-full flex flex-col justify-center items-center">
            <CldUploadButton
                onSuccess={(result: CloudinaryUploadWidgetResults) => {
                    const { info } = result;
                    if (isCloudinaryUploadWidgetInfo(info)) {
                        onChange(info.secure_url);
                    } else {
                        console.error("Upload failed, secure_url not found");
                    }
                }}
                options={{
                    maxFiles: 1
                }}
                uploadPreset="se1ruser"
            >
                <div className="p-4 border-4 border-dashed border-primary/10 rounded-lg hover:opacity-75 transition flex flex-col space-y-2 items-center justify-center">
                    <div className="relative h-40 w-40">
                        <Image
                            fill
                            alt="upload"
                            src={value || "/placeholder.svg"}
                            className="rounded-lg object-cover"
                        />
                    </div>
                </div>
            </CldUploadButton>
        </div>
    );
};
