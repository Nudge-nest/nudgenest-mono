export interface IReview {
    id?: string;
    merchantId: string;
    customerName: string;
    items: IReviewItem[];
    result?: IReviewResult[];
    status: 'Pending' | 'Completed' | 'Failed';
    createdAt: string;
    updatedAt: string;
    merchantBusinessId: string;
    replies: any;
    verified: boolean;
    merchantApiKey?: string;
}

export interface IReviewItem {
    id: string;
    name: string;
    image?: string;
    [key: string]: any;
}

export interface IReviewResult {
    id?: string;
    value?: number;
    mediaURL?: string;
    media?: IUploadedMediaObject[];
    comment?: string;
}

export interface IUploadedMediaObject {
    id: string;
    mediaURL: string;
}

export type UploadResult = Array<{
    id: string;
    url: string;
    filename: string;
    size: number;
    type: string;
}>;

// Additional types for components
export type SortType = 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_helpful';

export interface ApiResponse {
    data: IReview[];
    [key: string]: any;
}

export interface DropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    position?: 'left' | 'right';
    width?: string;
}

export interface RatingDistributionProps {
    reviews: IReview[];
}

export interface ReviewSummaryProps {
    reviews: IReview[];
}

export interface SortOption {
    value: SortType;
    label: string;
}

export interface SortOptionsProps {
    currentSort: SortType;
    onSortChange: (sortType: SortType) => void;
    onAddReview: () => void;
}

export interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    mediaItems: IUploadedMediaObject[];
    startIndex?: number;
}

export interface ReviewFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    merchantId: string;
}

export interface ReviewItemProps {
    review: IReview;
    onMediaClick: (media: IUploadedMediaObject[], startIndex: number) => void;
}

export interface ReviewContainerProps {
    merchantId?: string;
}

export interface StarRatingProps {
    rating: number;
    size?: number;
    showEmpty?: boolean;
}
