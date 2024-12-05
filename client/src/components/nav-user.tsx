'use client';

import { ChevronsUpDown, HammerIcon, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { useSession } from '@/lib/SessionProvider';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/lib/UserProvider';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { EditProfileDialog } from './EditProfileDialog';
import { useState } from 'react';

export function NavUser({
    user,
}: {
    user: {
        id: string;
        name: string;
        email: string;
        avatar: string;
        admin: boolean;
        phoneNumber: string;
    };
}) {
    const { isMobile } = useSidebar();
    const firstName = user.name.split(' ')[0];
    const { deleteSession } = useSession();
    const lastName = user.name.split(' ')[1];
    const navigate = useNavigate();
    const { user: currentUser } = useUser();

    const logOutSubmit = async () => {
        await deleteSession();
        navigate('/');
    };

    const [isEditDialogOpen, setEditDialogOpen] = useState(false);

    const handleEditProfileClick = (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent the dropdown from closing
        e.stopPropagation(); // Stop the event from bubbling up
        setEditDialogOpen(true);
    };

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size='lg'
                            className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                        >
                            {!user.admin ? (
                                <Avatar className='h-8 w-8 rounded-lg'>
                                    <AvatarImage src={user.avatar} alt={user.name} />
                                    <AvatarFallback className='rounded-lg bg-indigo-500 text-slate-100 dark:text-slate-900'>
                                        {user.name.split(' ')[0][0] + user.name.split(' ')[1][0]}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className='p-2 rounded-lg flex items-center justify-center bg-orange-500 text-slate-100 dark:text-slate-900'>
                                            <ShieldCheck size={20} />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Admin</TooltipContent>
                                </Tooltip>
                            )}

                            <div className='grid flex-1 text-left text-sm leading-tight'>
                                <span className='truncate font-semibold'>{user.name}</span>
                                <span className='truncate text-xs'>{user.email}</span>
                            </div>
                            <ChevronsUpDown className='ml-auto size-4' />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className='w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg'
                        side={isMobile ? 'bottom' : 'right'}
                        align='end'
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className='p-0 font-normal'>
                            <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                                {!user.admin ? (
                                    <Avatar className='h-8 w-8 rounded-lg'>
                                        <AvatarImage src={user.avatar} alt={user.name} />
                                        <AvatarFallback className='rounded-lg bg-indigo-500 text-slate-100 dark:text-slate-900'>
                                            {user.name.split(' ')[0][0] + user.name.split(' ')[1][0]}
                                        </AvatarFallback>
                                    </Avatar>
                                ) : (
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <div className='p-2 rounded-lg flex items-center justify-center bg-orange-500 text-slate-100 dark:text-slate-900'>
                                                <ShieldCheck size={20} />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Admin</TooltipContent>
                                    </Tooltip>
                                )}
                                <div className='grid flex-1 text-left text-sm leading-tight'>
                                    <div>
                                        <span className='truncate font-semibold'>{user.name}</span>
                                    </div>
                                    <span className='truncate text-xs'>{user.email}</span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem onClick={handleEditProfileClick}>
                                <Sparkles className='mr-2' />
                                <span>Edit Profile</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuGroup>
                            <DropdownMenuItem>
                                <HammerIcon />
                                Developer Mode
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logOutSubmit}>
                            <LogOut />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <EditProfileDialog
                    user={{
                        id: user.id,
                        firstName: firstName,
                        lastName: lastName,
                        phoneNumber: user.phoneNumber,
                        email: user.email,
                    }}
                    isOpen={isEditDialogOpen}
                    onClose={() => setEditDialogOpen(false)}
                />
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
