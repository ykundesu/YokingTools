export interface FeatureModule {
  id: string;
  title: string;
  description: string;
  render: (container: HTMLElement) => () => void;
}

export interface ApiErrorBody {
  ok: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiSuccessBody<T> {
  ok: true;
  data: T;
}
