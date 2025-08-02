import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
interface WorkspaceAvatarProps {
    image?: string;
    name: string;
    className?: string;
}

export const WorkspaceAvatar = ({
    image,
    name,
    className,
}:
    WorkspaceAvatarProps) => {
    if (image) {
        return (
            <div className={cn(
                'relative size-10 rounded-md overflow-hidden',
                className
            )}>
                <Image src={image} alt={name} fill className='object-cover' sizes='size-10'  />
            </div>
        );
    }

    return (
        <Avatar className={cn(
            'size-10 rounded-md bg-blue-600',
            className
            )}>
            <AvatarFallback className='text-white bg-blue-600 font-semibold text-lg'>
                {name[0].toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )

}