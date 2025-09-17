import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback} from '@/components/ui/avatar';
interface ProjectAvatarProps {
    image?: string;
    name: string;
    className?: string;
    fallbackClassname?:string;
}

export const ProjectAvatar = ({
    image,
    name,
    className,
    fallbackClassname
}:
    ProjectAvatarProps) => {
    if (image) {
        return (
            <div className={cn(
                'relative size-5 rounded-md overflow-hidden',
                className
            )}>
                <Image src={image} alt={name} fill className='object-cover' sizes='size-10' />
            </div>
        );
    }

    return (
        <Avatar className={cn(
            'size-5 rounded-md bg-blue-600',
            className
        )}>
            <AvatarFallback className={cn('text-white bg-blue-600 font-semibold text-sm',fallbackClassname)}>
                {name[0].toUpperCase()}
            </AvatarFallback>
        </Avatar>
    )

}